'use strict';
'require view';
'require form';
'require rpc';
'require fs';
'require uci';
'require poll';
'require ui';

const INI_FILE = '/etc/vlmcsd.ini';

const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: [ 'name' ],
	expect: { '': {} },
	reject: true
});

const callUciChanges = rpc.declare({
	object: 'uci',
	method: 'changes',
	expect: { changes: {} },
	reject: true
});

function normalizeIni(content) {
	return content.replace(/\r\n?/g, '\n');
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('vlmcsd'),
			fs.read(INI_FILE).then(function(content) {
				return { content: normalizeIni(content) };
			}).catch(function(error) {
				return { error: error.message };
			}),
			callServiceList('vlmcsd').catch(function() { return null; })
		]);
	},

	updateStatus: function(data) {
		let running = null;

		if (data != null) {
			const instances = data.vlmcsd && data.vlmcsd.instances || {};
			running = Object.keys(instances).some(function(name) {
				return instances[name].running === true;
			});
		}

		this.statusNode.textContent = running === true ? _('Running')
			: running === false ? _('Stopped') : _('Unable to query service status');
		this.statusNode.style.color = running === true ? 'green' : running === false ? 'red' : '';
	},

	pollStatus: function() {
		return callServiceList('vlmcsd')
			.then(this.updateStatus.bind(this))
			.catch(this.updateStatus.bind(this, null));
	},

	refreshPendingChanges: function() {
		return callUciChanges().then((changes) => {
			this.pendingUci = (changes.vlmcsd || []).length > 0;
			this.pendingUciError = null;
		}).catch((error) => {
			this.pendingUci = true;
			this.pendingUciError = error.message;
		});
	},

	canEditIni: function() {
		const configured = uci.get('vlmcsd', 'config', 'config_file') || INI_FILE;
		const selected = this.configFileOption.formvalue('config') || INI_FILE;

		return !this.map.readonly && this.iniLoaded && this.pendingUci === false &&
			this.loadedConfigPath === INI_FILE && configured === INI_FILE && selected === INI_FILE;
	},

	updateEditorState: function() {
		if (!this.editor)
			return;

		const editable = this.canEditIni();
		this.editor.disabled = !editable || !!this.savingIni;
		this.saveIniButton.disabled = !editable || !!this.savingIni;

		let message = _('INI changes are saved immediately, outside UCI rollback. This button does not save or apply the settings on the General settings tab.');
		if (!this.iniLoaded)
			message += ' ' + _('Unable to read INI file:') + ' ' + this.iniError;
		else if (this.map.readonly)
			message += ' ' + _('Read-only access: editing and restarting are disabled.');
		else if (this.pendingUciError)
			message += ' ' + _('Unable to check pending UCI changes:') + ' ' + this.pendingUciError;
		else if (this.pendingUci)
			message += ' ' + _('Apply or revert pending vlmcsd settings and reload this page before editing INI.');
		else if (!editable)
			message += ' ' + _('The editor is available only for /etc/vlmcsd.ini. If you change the configuration path, apply the settings and reload this page.');
		this.editorWarning.textContent = message;
	},

	handleSaveIni: async function() {
		if (this.savingIni || !this.canEditIni())
			return;

		this.savingIni = true;
		this.updateEditorState();
		let saved = false;

		try {
			await this.refreshPendingChanges();
			if (!this.canEditIni())
				return;

			const content = normalizeIni(this.editor.value);
			if (content === this.savedIni && !this.restartPending)
				return;

			if (content !== this.savedIni)
				await fs.write(INI_FILE, content);
			this.savedIni = content;
			this.restartPending = true;
			saved = true;

			const result = await fs.exec('/etc/init.d/vlmcsd', [ 'restart' ]);
			if (result.code !== 0)
				throw new Error(result.stderr || _('The service command returned an error.'));

			this.restartPending = false;
			ui.addNotification(null, E('p', {}, _('INI file saved and service restart requested.')), 'info');
			await this.pollStatus();
		}
		catch (error) {
			const message = saved
				? _('INI file saved, but service restart failed:')
				: _('Unable to save INI file:');
			ui.addNotification(null, E('p', {}, message + ' ' + error.message), 'error');
		}
		finally {
			this.savingIni = false;
			this.updateEditorState();
		}
	},

	render: function(data) {
		this.iniLoaded = typeof data[1].content === 'string';
		this.iniError = data[1].error;
		this.savedIni = this.iniLoaded ? data[1].content : '';
		this.loadedConfigPath = uci.get('vlmcsd', 'config', 'config_file') || INI_FILE;
		this.restartPending = false;

		this.statusNode = E('span', { 'role': 'status', 'style': 'font-weight: bold' });
		this.updateStatus(data[2]);
		const description = E('div', {}, [
			E('p', {}, [ E('strong', {}, _('Service status') + ': '), this.statusNode ]),
			E('p', {}, _('Configure vlmcsd and automatic DNS SRV discovery.'))
		]);
		const m = this.map = new form.Map('vlmcsd', _('vlmcsd'), description);
		const s = m.section(form.NamedSection, 'config', 'vlmcsd');
		s.addremove = false;
		s.tab('general', _('General settings'));
		s.tab('ini', _('INI configuration'));

		let o = s.taboption('general', form.Flag, 'enabled', _('Enable'),
			_('Allow the procd service to run vlmcsd.'));
		o.default = '0';
		o.rmempty = false;

		o = s.taboption('general', form.Flag, 'auto_update_srv', _('Automatic DNS SRV record'),
			_('Let the service maintain the DNS SRV record for automatic discovery.'));
		o.default = '1';
		o.rmempty = false;

		o = s.taboption('general', form.Value, 'port', _('Port'));
		o.datatype = 'and(port,range(1,65535))';
		o.default = '1688';
		o.rmempty = false;

		o = this.configFileOption = s.taboption('general', form.Value, 'config_file', _('INI file path'));
		o.default = INI_FILE;
		o.rmempty = false;
		o.onchange = this.updateEditorState.bind(this);

		o = s.taboption('general', form.Value, 'kms_data_file', _('KMD file path'));
		o.default = '/etc/vlmcsd.kmd';
		o.rmempty = false;

		o = s.taboption('ini', form.DummyValue, '_ini', _('INI configuration'));
		o.renderWidget = async () => {
			await this.refreshPendingChanges();
			// UCI saves and resets rebuild widgets; keep the separate INI draft.
			const draft = this.editor ? this.editor.value : this.savedIni;
			this.editorWarning = E('p', { 'class': 'cbi-value-description', 'role': 'status' });
			this.editor = E('textarea', {
				'class': 'cbi-input-textarea',
				'rows': 20,
				'wrap': 'off',
				'spellcheck': 'false',
				'aria-label': _('Contents of /etc/vlmcsd.ini')
			});
			this.editor.style.width = '100%';
			this.editor.style.boxSizing = 'border-box';
			this.editor.value = draft;
			this.saveIniButton = E('button', {
				'class': 'cbi-button cbi-button-apply',
				'type': 'button',
				'click': this.handleSaveIni.bind(this)
			}, _('Save INI and restart service'));
			this.updateEditorState();
			return E('div', {}, [ this.editorWarning, this.editor, E('p', {}, this.saveIniButton) ]);
		};

		return m.render().then((node) => {
			this.updateEditorState();
			if (!this.pollFn) {
				this.pollFn = this.pollStatus.bind(this);
				poll.add(this.pollFn, 5);
			}
			return node;
		});
	}
});
