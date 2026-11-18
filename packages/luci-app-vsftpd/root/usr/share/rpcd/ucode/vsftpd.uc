#!/usr/bin/env ucode

'use strict';

import { popen } from 'fs';

const methods = {
	get_status: {
		call: function() {
			const proc = popen('/etc/init.d/vsftpd status 2>&1', 'r');
			const out = proc ? proc.read('all') : '';
			if (proc) proc.close();
			return { running: index(out, 'running') >= 0 };
		}
	}
};

return { 'luci.vsftpd': methods };
