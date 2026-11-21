#!/usr/bin/env ucode

'use strict';

import { connect } from 'ubus';

return {
	'luci.vhusbd': {
		get_status: {
			call: function() {
				const ubus = connect();
				const services = ubus?.call('service', 'list', { name: 'vhusbd' });
				if (type(services) != 'object')
					return { running: null };

				const instances = services.vhusbd?.instances ?? {};
				for (let name in instances) {
					if (instances[name].running === true)
						return { running: true };
				}
				return { running: false };
			}
		}
	}
};
