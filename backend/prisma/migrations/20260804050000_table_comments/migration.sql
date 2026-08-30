-- Clear table comments for phpMyAdmin browsing
ALTER TABLE `Brand` COMMENT = 'Marketplace brands / makers (public /brands pages)';
ALTER TABLE `BrandUser` COMMENT = 'Brand portal login accounts (owners)';
ALTER TABLE `Client` COMMENT = 'Shopper accounts (checkout, bag, orders)';
ALTER TABLE `SuperAdmin` COMMENT = 'Platform super-admin accounts';
ALTER TABLE `PlatformSettings` COMMENT = 'Singleton marketplace commission settings';
ALTER TABLE `Product` COMMENT = 'Catalog products sold by brands';
ALTER TABLE `Event` COMMENT = 'Ticketed events hosted by brands';
ALTER TABLE `Ad` COMMENT = 'Public ads board creatives';
ALTER TABLE `Payout` COMMENT = 'Brand payout requests';
ALTER TABLE `EmailCode` COMMENT = 'Email verification and password-reset codes';
ALTER TABLE `SharedCart` COMMENT = 'Share-bag links for gift / pay-for-me checkout';
ALTER TABLE `Order` COMMENT = 'Paid orders with delivery tracking';
ALTER TABLE `OrderItem` COMMENT = 'Line items belonging to an Order';
