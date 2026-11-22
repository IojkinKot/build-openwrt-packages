'use strict';
'require view';
'require form';
'require fs';
'require rpc';
'require poll';
'require ui';

const CONFIG_FILE = '/etc/virtualhere.conf';

const callGetStatus = rpc.declare({
	object: 'luci.vhusbd',
	method: 'get_status',
	expect: { '': {} },
	reject: true
});

function getStatus() {
	return callGetStatus().catch(() => null);
}

function renderStatus(label, status) {
	const running = status?.running;
	label.textContent = running === true ? _('Running') : running === false ? _('Stopped') : _('Unavailable');
	label.style.color = running === true ? 'green' : running === false ? 'red' : '';
}

return view.extend({
	load: function() {
		return Promise.all([
			fs.read(CONFIG_FILE).then(content => ({ content })).catch(error =>
				error.name === 'NotFoundError' ? { missing: true } : { error }),
			getStatus()
		]);
	},

	handleSaveFile: async function() {
		if (!this.fileEditable || this.savingFile)
			return;

		const content = this.editor.value;
		if (content === this.savedContent)
			return;

		this.savingFile = this.editor.disabled = this.saveFileButton.disabled = true;
		try {
			await fs.write(CONFIG_FILE, content, 0o600);
			this.savedContent = content;
			ui.addNotification(null, E('p', {}, _('Configuration file saved.')), 'info');
		}
		catch (error) {
			const message = E('p', {});
			message.textContent = _('Unable to save the configuration file:') + ' ' + error.message;
			ui.addNotification(null, message, 'error');
		}
		finally {
			this.savingFile = this.editor.disabled = this.saveFileButton.disabled = false;
		}
	},

	render: async function([file, status]) {
		const statusLabel = E('span', { role: 'status', style: 'font-weight: bold' });
		renderStatus(statusLabel, status);
		const statusBadge = E('p', {}, [ E('strong', {}, _('Service Status') + ': '), statusLabel ]);

		const m = new form.Map('vhusbd', _('VirtualHere USB Server'), statusBadge);
		const s = m.section(form.NamedSection, 'config', 'vhusbd');
		s.addremove = false;
		const enabled = s.option(form.Flag, 'enabled', _('Enabled'));
		enabled.default = '0';
		enabled.rmempty = false;
		const map = await m.render();

		this.fileEditable = !m.readonly && !file.error;
		this.editor = E('textarea', {
			class: 'cbi-input-textarea',
			rows: 20,
			wrap: 'off',
			spellcheck: 'false',
			'aria-label': _('Contents of /etc/virtualhere.conf')
		});
		this.editor.style.width = '100%';
		this.editor.style.boxSizing = 'border-box';
		this.editor.value = file.content ?? '';
		this.savedContent = file.missing ? null : this.editor.value;
		this.editor.disabled = !this.fileEditable;

		this.saveFileButton = E('button', {
			class: 'cbi-button cbi-button-save',
			type: 'button',
			click: this.handleSaveFile.bind(this)
		}, _('Save file'));
		this.saveFileButton.disabled = !this.fileEditable;

		const description = E('p', {}, _('Saving writes the file immediately, outside UCI rollback, without restarting the service.'));
		const editor = E('div', { class: 'cbi-section' }, [
			E('h3', {}, CONFIG_FILE), description, this.editor, E('p', {}, [ this.saveFileButton ])
		]);
		if (file.error)
			description.textContent = _('Unable to read the configuration file:') + ' ' + file.error.message;

		poll.add(() => getStatus().then(result => renderStatus(statusLabel, result)), 5);
		return E('div', {}, [ map, editor ]);
	}
});
