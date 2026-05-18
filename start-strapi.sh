#!/bin/bash
# Script wrapper para iniciar Strapi en PRODUCCIÓN

# Cargar variables del archivo .env
export $(grep -v '^#' /home/deploy/backend/.env | xargs)

# IMPORTANTE: Usar 'start' no 'develop' en producción
exec /home/deploy/backend/node_modules/@strapi/strapi/bin/strapi.js start "$@"
