-- Migration 004: Add password reset token columns to users table
ALTER TABLE `users`
ADD COLUMN `reset_password_token` VARCHAR(255) NULL DEFAULT NULL AFTER `previous_password_hash`,
ADD COLUMN `reset_password_expires` TIMESTAMP NULL DEFAULT NULL AFTER `reset_password_token`;

