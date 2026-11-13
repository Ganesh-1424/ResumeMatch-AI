-- Migration 003: Add previous_password_hash to users table
ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `previous_password_hash` VARCHAR(255) NULL DEFAULT NULL AFTER `password_hash`;

