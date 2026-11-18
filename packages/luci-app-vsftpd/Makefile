# See /LICENSE for more information.
# This is free software, licensed under the GNU General Public License v2.

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Support for vsftpd
LUCI_DEPENDS:=+luci-base +vsftpd||+vsftpd-tls
LUCI_PKGARCH:=all

PKG_LICENSE:=GPL-2.0
PKG_MAINTAINER:=

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
