'use strict';

function createOtpService({ strapi }) {
  const knex = strapi.db.connection;

  return {
    generateCode() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    },

    async createOtp(userId) {
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      await knex('otp_codes').insert({
        code,
        user_id: userId,
        expires_at: expiresAt,
        attempts: 0,
      });

      return code;
    },

    async findActiveOtp(userId) {
      return knex('otp_codes')
        .where({ user_id: userId })
        .whereNull('used_at')
        .orderBy('created_at', 'desc')
        .first();
    },

    async verifyOtp(userId, inputCode) {
      const otp = await this.findActiveOtp(userId);

      if (!otp) {
        return { valid: false, reason: 'NO_OTP' };
      }

      // Verificar bloqueo por intentos fallidos
      if (otp.blocked_until && new Date(otp.blocked_until) > new Date()) {
        return { valid: false, reason: 'BLOCKED', blockedUntil: otp.blocked_until };
      }

      // Verificar expiración
      if (new Date(otp.expires_at) < new Date()) {
        return { valid: false, reason: 'EXPIRED' };
      }

      // Verificar código
      if (otp.code !== inputCode) {
        const newAttempts = (otp.attempts || 0) + 1;
        const updates = { attempts: newAttempts };

        if (newAttempts >= 3) {
          updates.blocked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de bloqueo
        }

        await knex('otp_codes').where({ id: otp.id }).update(updates);

        return {
          valid: false,
          reason: 'INVALID',
          remainingAttempts: Math.max(0, 3 - newAttempts),
          blocked: newAttempts >= 3,
        };
      }

      // Éxito: marcar como usado
      await knex('otp_codes').where({ id: otp.id }).update({ used_at: new Date() });

      return { valid: true, otpId: otp.id };
    },

    async cleanupOldOtps(userId) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await knex('otp_codes')
        .where({ user_id: userId })
        .andWhere(function () {
          this.whereNotNull('used_at').orWhere('expires_at', '<', cutoff);
        })
        .del();
    },
  };
}

module.exports = createOtpService;
