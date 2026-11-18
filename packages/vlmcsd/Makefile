include $(TOPDIR)/rules.mk

PKG_NAME:=vlmcsd
PKG_VERSION:=1.1.13
PKG_GIT_VERSION:=svn1113
PKG_RELEASE:=1

PKG_MAINTAINER:=HotBird64
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

PKG_SOURCE:=$(PKG_GIT_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/cokebar/vlmcsd/archive
PKG_MD5SUM:=ea19cc1346fba447daced0224b670423

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_GIT_VERSION)
PKG_BUILD_PARALLEL:=1

include $(INCLUDE_DIR)/package.mk

define Package/vlmcsd
	SECTION:=net
	CATEGORY:=Network
	TITLE:=vlmcsd for OpenWRT
	URL:=http://forums.mydigitallife.info/threads/50234
	DEPENDS:=+libpthread
endef

define Package/vlmcsd/description
	vlmcsd is a KMS Emulator in C.
endef

define Package/vlmcsd/conffiles
/etc/config/vlmcsd
endef

MAKE_FLAGS += \
	-C $(PKG_BUILD_DIR)

define Package/vlmcsd/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/bin/vlmcsd $(1)/usr/bin/vlmcsd
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/bin/vlmcs $(1)/usr/bin/vlmcs
	$(INSTALL_DIR) $(1)/etc
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/etc/vlmcsd.ini $(1)/etc/vlmcsd.ini
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/etc/vlmcsd.kmd $(1)/etc/vlmcsd.kmd
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/vlmcsd.init $(1)/etc/init.d/vlmcsd
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/vlmcsd.uci $(1)/etc/config/vlmcsd
endef

$(eval $(call BuildPackage,vlmcsd))
