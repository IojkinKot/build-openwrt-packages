'use strict';
'require view';
'require form';
'require rpc';
'require ui';

const callGetStatus = rpc.declare({
	object: 'luci.vsftpd',
	method: 'get_status',
	expect: { '': {} }
});

return view.extend({
	load: function() {
		return callGetStatus();
	},

	render: function(status) {
		let m, s, o;

		const statusBadge = E('p', {}, [
			E('strong', {}, _('Service Status') + ': '),
			E('span', {
				style: status.running
					? 'color: green; font-weight: bold'
					: 'color: red; font-weight: bold'
			}, status.running ? _('Running') : _('Stopped'))
		]);

		m = new form.Map('vsftpd', _('FTP Server (vsftpd)'), statusBadge);

		s = m.section(form.NamedSection, 'global', 'global');
		s.addremove = false;
		s.anonymous = false;

		// ── Tab: General ──────────────────────────────────────────────────────
		s.tab('general', _('General Settings'));

		o = s.taboption('general', form.Flag, 'disabled', _('Disabled'),
			_('Disable the vsftpd service entirely.'));
		o.default = '0';
		o.rmempty = false;

		o = s.taboption('general', form.ListValue, 'listen_mode',
			_('Listen Mode'), _('IP protocol to listen on.'));
		o.value('both', _('IPv4 and IPv6 (dual-stack)'));
		o.value('ipv4', _('IPv4 only'));
		o.default = 'both';
		o.rmempty = false;

		o = s.taboption('general', form.Value, 'listen_port',
			_('FTP Port'), _('TCP port for incoming connections (default: 21).'));
		o.datatype = 'port';
		o.placeholder = '21';

		o = s.taboption('general', form.Flag, 'mdns', _('mDNS Advertisement'),
			_('Advertise the FTP service via mDNS/Avahi.'));
		o.default = '0';

		o = s.taboption('general', form.Value, 'ftpd_banner',
			_('Welcome Banner'), _('Message shown to clients upon connection.'));
		o.placeholder = _('Welcome to FTP service.');

		o = s.taboption('general', form.Value, 'conf_file',
			_('Custom Config File'),
			_('Path to a static vsftpd.conf. Leave empty to use UCI settings above.'));
		o.placeholder = '';
		o.default = '';
		o.rmempty = false;

		// ── Tab: Users ────────────────────────────────────────────────────────
		s.tab('users', _('Users'));

		o = s.taboption('users', form.Flag, 'local_enable',
			_('Allow Local Users'), _('Permit local system users to log in.'));
		o.default = '1';
		o.rmempty = false;

		o = s.taboption('users', form.Value, 'local_root',
			_('Local Root Directory'),
			_('Directory to change into after local user login. Leave empty for home directory.'));
		o.datatype = 'directory';
		o.placeholder = '/home/ftp';

		o = s.taboption('users', form.Flag, 'write_enable',
			_('Allow Writes'),
			_('Enable write commands (upload, delete, rename).'));
		o.default = '1';
		o.rmempty = false;

		o = s.taboption('users', form.Value, 'local_umask',
			_('Local Umask'),
			_('Umask for files created by local users (octal, e.g. 022).'));
		o.placeholder = '022';

		o = s.taboption('users', form.Flag, 'anonymous_enable',
			_('Allow Anonymous Access'),
			_('Permit anonymous FTP logins.'));
		o.default = '0';
		o.rmempty = false;

		o = s.taboption('users', form.Value, 'anon_root',
			_('Anonymous Root Directory'),
			_('Directory to change into after anonymous login.'));
		o.datatype = 'directory';
		o.placeholder = '/var/ftp';

		o = s.taboption('users', form.Flag, 'chroot_local_user',
			_('Chroot Local Users'),
			_('Restrict local users to their home directory via chroot.'));
		o.default = '0';

		o = s.taboption('users', form.Flag, 'allow_writeable_chroot',
			_('Allow Writeable Chroot'),
			_('Allow chroot directory to be writeable (security risk; use with caution).'));
		o.default = '0';

		o = s.taboption('users', form.Flag, 'check_shell',
			_('Check Shell'),
			_('Deny login if user shell is not listed in /etc/shells.'));
		o.default = '0';

		o = s.taboption('users', form.Flag, 'dirmessage_enable',
			_('Directory Messages'),
			_('Show .message file contents when entering a directory.'));
		o.default = '1';

		// ── Tab: Passive Mode ─────────────────────────────────────────────────
		s.tab('passive', _('Passive Mode'));

		o = s.taboption('passive', form.Flag, 'pasv_enable',
			_('Enable Passive Mode (PASV)'),
			_('Allow passive mode data connections.'));
		o.default = '1';

		o = s.taboption('passive', form.Value, 'pasv_min_port',
			_('Minimum PASV Port'),
			_('Lowest port for passive mode data connections (0 = any).'));
		o.datatype = 'uinteger';
		o.placeholder = '0';

		o = s.taboption('passive', form.Value, 'pasv_max_port',
			_('Maximum PASV Port'),
			_('Highest port for passive mode data connections (0 = any).'));
		o.datatype = 'uinteger';
		o.placeholder = '0';

		// ── Tab: SSL/TLS ──────────────────────────────────────────────────────
		s.tab('ssl', _('SSL/TLS'));

		o = s.taboption('ssl', form.Flag, 'ssl_enable',
			_('Enable SSL/TLS'),
			_('Enable SSL/TLS support (requires vsftpd-tls variant).'));
		o.default = '0';

		o = s.taboption('ssl', form.ListValue, 'invoking_security_mode',
			_('TLS Mode'),
			_('How TLS is invoked for connections.'));
		o.value('explicit', _('Explicit TLS via STARTTLS (port 21)'));
		o.value('both',     _('Both Explicit (port 21) and Implicit (port 990)'));
		o.value('implicit', _('Implicit TLS only (port 990)'));
		o.default = 'explicit';

		o = s.taboption('ssl', form.Value, 'listen_port_implicit',
			_('Implicit TLS Port'),
			_('TCP port for implicit TLS connections (default: 990).'));
		o.datatype = 'port';
		o.placeholder = '990';

		o = s.taboption('ssl', form.Flag, 'allow_anon_ssl',
			_('Allow Anonymous SSL'),
			_('Allow anonymous users to use SSL connections.'));
		o.default = '0';

		o = s.taboption('ssl', form.Flag, 'force_local_data_ssl',
			_('Require SSL for Data'),
			_('Require SSL for local user data connections.'));
		o.default = '0';

		o = s.taboption('ssl', form.Flag, 'force_local_logins_ssl',
			_('Require SSL for Login'),
			_('Require SSL for local user login.'));
		o.default = '0';

		o = s.taboption('ssl', form.Flag, 'ssl_tlsv1',
			_('Enable TLSv1'), _('Allow TLS version 1.'));
		o.default = '1';

		o = s.taboption('ssl', form.Flag, 'ssl_sslv2',
			_('Enable SSLv2'), _('Allow SSL version 2 (insecure, not recommended).'));
		o.default = '0';

		o = s.taboption('ssl', form.Flag, 'ssl_sslv3',
			_('Enable SSLv3'), _('Allow SSL version 3 (insecure, not recommended).'));
		o.default = '0';

		o = s.taboption('ssl', form.Value, 'rsa_cert_file',
			_('RSA Certificate File'),
			_('Path to the SSL/TLS certificate file.'));
		o.placeholder = '/etc/vsftpd/vsftpd.pem';

		o = s.taboption('ssl', form.Value, 'rsa_private_key_file',
			_('RSA Private Key File'),
			_('Path to the SSL/TLS private key file.'));
		o.placeholder = '/etc/vsftpd/vsftpd.pem';

		// ── Tab: Logging ──────────────────────────────────────────────────────
		s.tab('logging', _('Logging'));

		o = s.taboption('logging', form.Flag, 'syslog_enable',
			_('Log to Syslog'),
			_('Send log messages to syslog instead of a log file.'));
		o.default = '0';

		o = s.taboption('logging', form.Flag, 'xferlog_enable',
			_('Transfer Log'),
			_('Enable logging of file transfers.'));
		o.default = '0';

		o = s.taboption('logging', form.Value, 'xferlog_file',
			_('Transfer Log File'),
			_('Path to the transfer log file.'));
		o.placeholder = '/var/log/vsftpd.log';

		o = s.taboption('logging', form.Flag, 'xferlog_std_format',
			_('Standard Xferlog Format'),
			_('Use standard xferlog format (compatible with wu-ftpd).'));
		o.default = '0';

		o = s.taboption('logging', form.Value, 'vsftpd_log_file',
			_('vsftpd Log File'),
			_('Path to the vsftpd-specific log file.'));
		o.placeholder = '/var/log/vsftpd.log';

		o = s.taboption('logging', form.Flag, 'session_support',
			_('Session Support'),
			_('Maintain login sessions (requires PAM, usually disabled on OpenWrt).'));
		o.default = '0';

		o = s.taboption('logging', form.Flag, 'userlist_enable',
			_('User List'),
			_('Enable a user list file to allow or deny specific users.'));
		o.default = '0';

		o = s.taboption('logging', form.Flag, 'userlist_deny',
			_('User List is Deny List'),
			_('If enabled, listed users are denied. If disabled, only listed users are allowed.'));
		o.default = '1';

		o = s.taboption('logging', form.Value, 'userlist_file',
			_('User List File'),
			_('Path to the user list file.'));
		o.placeholder = '/etc/vsftpd.user_list';

		return m.render();
	}
});
