include $(TOPDIR)/rules.mk

PKG_NAME:=vhusbd
PKG_VERSION:=4.8.9
PKG_RELEASE:=1
PKG_LICENSE:=Proprietary

PKG_SOURCE:=vhusbdarm64a53-$(PKG_VERSION)
PKG_SOURCE_URL:=https://www.virtualhere.com/sites/default/files/usbserver
PKG_SOURCE_URL_FILE:=vhusbdarm64a53
PKG_HASH:=e25281275f9cd66977ef8991d0345949885cdd817abba41847a0f3a5757040a1

include $(INCLUDE_DIR)/package.mk

# Preserve the vendor ELF byte-for-byte in the package.
RSTRIP:=:

define Package/vhusbd
	SECTION:=net
	CATEGORY:=Network
	TITLE:=VirtualHere USB Server (Cortex-A53)
	URL:=https://www.virtualhere.com/usb_server_software
	DEPENDS:=@TARGET_mediatek_filogic
endef

define Package/vhusbd/description
 VirtualHere USB Server shares locally connected USB devices over the network.
 The optimized Cortex-A53 build requires a VirtualHere license.
endef

define Package/vhusbd/conffiles
/etc/config/vhusbd
endef

define Build/Prepare
	printf '%s  %s\n' '$(PKG_HASH)' '$(DL_DIR)/$(PKG_SOURCE)' | sha256sum -c -
	$(INSTALL_DIR) $(PKG_BUILD_DIR)
	$(INSTALL_BIN) $(DL_DIR)/$(PKG_SOURCE) $(PKG_BUILD_DIR)/vhusbd
endef

define Build/Compile
endef

define Package/vhusbd/install
	$(INSTALL_DIR) $(1)/usr/bin $(1)/etc/init.d $(1)/etc/config $(1)/lib/upgrade/keep.d
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/vhusbd $(1)/usr/bin/vhusbd
	$(INSTALL_BIN) ./files/vhusbd.init $(1)/etc/init.d/vhusbd
	$(INSTALL_CONF) ./files/vhusbd.uci $(1)/etc/config/vhusbd
	$(INSTALL_DATA) ./files/vhusbd.keep $(1)/lib/upgrade/keep.d/vhusbd
endef

$(eval $(call BuildPackage,vhusbd))
