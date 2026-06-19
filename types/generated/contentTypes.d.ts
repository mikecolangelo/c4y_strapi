import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::api-token-permission'>;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token-permission'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> & Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deviceId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime & Schema.Attribute.Required & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    userId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token-permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token-permission'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> & Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAppointmentAppointment extends Struct.CollectionTypeSchema {
  collectionName: 'appointments';
  info: {
    displayName: 'Appointment';
    pluralName: 'appointments';
    singularName: 'appointment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assignedTo: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    childAppointments: Schema.Attribute.Relation<'oneToMany', 'api::appointment.appointment'>;
    clientEmail: Schema.Attribute.Email;
    clientName: Schema.Attribute.String;
    clientPhone: Schema.Attribute.String;
    contactEmail: Schema.Attribute.Email;
    contactPhone: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    durationMinutes: Schema.Attribute.Integer;
    frequency: Schema.Attribute.Enumeration<['unica', 'semanal', 'quincenal', 'mensual']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'unica'>;
    isAllDay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::appointment.appointment'> &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    parentAppointment: Schema.Attribute.Relation<'manyToOne', 'api::appointment.appointment'>;
    price: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    service: Schema.Attribute.Relation<'manyToOne', 'api::service.service'>;
    serviceOrder: Schema.Attribute.Relation<'manyToOne', 'api::service-order.service-order'>;
    status: Schema.Attribute.Enumeration<['confirmada', 'pendiente', 'cancelada']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pendiente'>;
    title: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<['venta', 'prueba', 'mantenimiento']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiBillingDocumentBillingDocument extends Struct.CollectionTypeSchema {
  collectionName: 'billing_documents';
  info: {
    displayName: 'Billing Document';
    pluralName: 'billing-documents';
    singularName: 'billing-document';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    file: Schema.Attribute.Media<'files' | 'images'> & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::billing-document.billing-document'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    record: Schema.Attribute.Relation<'manyToOne', 'api::billing-record.billing-record'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiBillingRecordBillingRecord extends Struct.CollectionTypeSchema {
  collectionName: 'billing_records';
  info: {
    description: 'Pago individual dentro de un financiamiento (Pago Hijo)';
    displayName: 'Billing Record';
    pluralName: 'billing-records';
    singularName: 'billing-record';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    advanceCredit: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    applications: Schema.Attribute.Relation<
      'oneToMany',
      'api::payment-application.payment-application'
    >;
    childRecords: Schema.Attribute.Relation<'oneToMany', 'api::billing-record.billing-record'>;
    comments: Schema.Attribute.Text;
    confirmationNumber: Schema.Attribute.String;
    coveredBy: Schema.Attribute.Relation<'manyToOne', 'api::billing-record.billing-record'>;
    coveredQuotas: Schema.Attribute.Relation<'oneToMany', 'api::billing-record.billing-record'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'USD'>;
    daysLate: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    documents: Schema.Attribute.Relation<'oneToMany', 'api::billing-document.billing-document'>;
    dueDate: Schema.Attribute.Date & Schema.Attribute.Required;
    financing: Schema.Attribute.Relation<'manyToOne', 'api::financing.financing'>;
    isSimulated: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lateFeeAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::billing-record.billing-record'> &
      Schema.Attribute.Private;
    parentRecord: Schema.Attribute.Relation<'manyToOne', 'api::billing-record.billing-record'>;
    paymentDate: Schema.Attribute.Date;
    publishedAt: Schema.Attribute.DateTime;
    quotaAmountCovered: Schema.Attribute.Decimal;
    quotaNumber: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    quotasCovered: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    receiptNumber: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    remainingQuotaBalance: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    status: Schema.Attribute.Enumeration<
      ['pagado', 'pendiente', 'adelanto', 'retrasado', 'abonado', 'cubierta']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pendiente'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    verifiedAt: Schema.Attribute.DateTime;
    verifiedBy: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    verifiedInBank: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface ApiClientClient extends Struct.CollectionTypeSchema {
  collectionName: 'clients';
  info: {
    description: 'Contactos y clientes gestionados en la plataforma';
    displayName: 'Client';
    pluralName: 'clients';
    singularName: 'client';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    address: Schema.Attribute.Text;
    avatar: Schema.Attribute.Media<'images'>;
    billingRecords: Schema.Attribute.Relation<'oneToMany', 'api::billing-record.billing-record'>;
    communicationLogs: Schema.Attribute.Relation<
      'oneToMany',
      'api::communication-log.communication-log'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deals: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'>;
    email: Schema.Attribute.Email;
    fullName: Schema.Attribute.String & Schema.Attribute.Required;
    leadSince: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::client.client'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    notifications: Schema.Attribute.Relation<'oneToMany', 'api::notification.notification'>;
    phone: Schema.Attribute.String;
    preferredVehicle: Schema.Attribute.Relation<'oneToOne', 'api::fleet.fleet'>;
    publishedAt: Schema.Attribute.DateTime;
    salesperson: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    status: Schema.Attribute.Enumeration<['lead', 'activo', 'vip']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'lead'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiCommunicationLogCommunicationLog extends Struct.CollectionTypeSchema {
  collectionName: 'communication_logs';
  info: {
    description: 'Historial de interacciones con clientes';
    displayName: 'Communication Log';
    pluralName: 'communication-logs';
    singularName: 'communication-log';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    authorName: Schema.Attribute.String;
    client: Schema.Attribute.Relation<'manyToOne', 'api::client.client'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::communication-log.communication-log'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    publishedAt: Schema.Attribute.DateTime;
    timestamp: Schema.Attribute.DateTime & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<['call', 'email', 'campaign']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'call'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiCompanyInfoCompanyInfo extends Struct.SingleTypeSchema {
  collectionName: 'company_infos';
  info: {
    description: 'Informaci\u00F3n de la empresa para contratos PDF y documentos legales';
    displayName: 'Company Info';
    pluralName: 'company-infos';
    singularName: 'company-info';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    companyAddress: Schema.Attribute.Text;
    companyName: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    legalRepMaritalStatus: Schema.Attribute.String;
    legalRepName: Schema.Attribute.String & Schema.Attribute.Required;
    legalRepNationality: Schema.Attribute.String;
    legalRepPassport: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::company-info.company-info'> &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images'>;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registryInfo: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiConfigurationConfiguration extends Struct.CollectionTypeSchema {
  collectionName: 'configurations';
  info: {
    description: 'Configuraciones del sistema para APIs externas y par\u00E1metros generales';
    displayName: 'Configuration';
    pluralName: 'configurations';
    singularName: 'configuration';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      ['general', 'whatsapp', 'google', 'company', 'billing']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'general'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    isSecret: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    key: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::configuration.configuration'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    value: Schema.Attribute.Text;
  };
}

export interface ApiContractDocumentContractDocument extends Struct.CollectionTypeSchema {
  collectionName: 'contract_documents';
  info: {
    displayName: 'Contract Document';
    pluralName: 'contract-documents';
    singularName: 'contract-document';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>;
    documentType: Schema.Attribute.Enumeration<['contrato', 'anexo', 'comprobante']> &
      Schema.Attribute.DefaultTo<'contrato'>;
    file: Schema.Attribute.Media<'files' | 'images'> & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::contract-document.contract-document'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiContractTypeContractType extends Struct.CollectionTypeSchema {
  collectionName: 'contract_types';
  info: {
    description: 'Tipos de contrato editables para Car4You';
    displayName: 'Contract Type';
    pluralName: 'contract-types';
    singularName: 'contract-type';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    defaultClauses: Schema.Attribute.Relation<'oneToMany', 'api::deal-clause.deal-clause'>;
    description: Schema.Attribute.Text;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::contract-type.contract-type'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    requiredDocuments: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiDashboardMetricDashboardMetric extends Struct.CollectionTypeSchema {
  collectionName: 'dashboard_metrics';
  info: {
    displayName: 'Dashboard Metric';
    pluralName: 'dashboard-metrics';
    singularName: 'dashboard-metric';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    category: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::dashboard-metric.dashboard-metric'
    > &
      Schema.Attribute.Private;
    meta: Schema.Attribute.JSON;
    periodType: Schema.Attribute.Enumeration<['today', 'week', 'month', 'year']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'today'>;
    periodValue: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    value: Schema.Attribute.Decimal & Schema.Attribute.Required;
  };
}

export interface ApiDashboardDashboard extends Struct.SingleTypeSchema {
  collectionName: 'dashboards';
  info: {
    displayName: 'Dashboard';
    pluralName: 'dashboards';
    singularName: 'dashboard';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    favicon: Schema.Attribute.Media<'images' | 'files'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::dashboard.dashboard'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sections: Schema.Attribute.DynamicZone<['layout.hero-section']>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiDealClauseDealClause extends Struct.CollectionTypeSchema {
  collectionName: 'deal_clauses';
  info: {
    displayName: 'Deal Clause';
    pluralName: 'deal-clauses';
    singularName: 'deal-clause';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::deal-clause.deal-clause'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiDealDiscountDealDiscount extends Struct.CollectionTypeSchema {
  collectionName: 'deal_discounts';
  info: {
    displayName: 'Deal Discount';
    pluralName: 'deal-discounts';
    singularName: 'deal-discount';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::deal-discount.deal-discount'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiDealDeal extends Struct.CollectionTypeSchema {
  collectionName: 'deals';
  info: {
    description: 'Contratos y acuerdos comerciales';
    displayName: 'Deal';
    pluralName: 'deals';
    singularName: 'deal';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    billingRecords: Schema.Attribute.Relation<'oneToMany', 'api::billing-record.billing-record'>;
    clauses: Schema.Attribute.Relation<'oneToMany', 'api::deal-clause.deal-clause'>;
    client: Schema.Attribute.Relation<'manyToOne', 'api::client.client'>;
    contractType: Schema.Attribute.Relation<'manyToOne', 'api::contract-type.contract-type'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    discounts: Schema.Attribute.Relation<'oneToMany', 'api::deal-discount.deal-discount'>;
    documents: Schema.Attribute.Relation<'oneToMany', 'api::contract-document.contract-document'>;
    generatedAt: Schema.Attribute.Date;
    initialDeposit: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'> &
      Schema.Attribute.Private;
    paymentAgreement: Schema.Attribute.Enumeration<['semanal', 'quincenal', 'mensual']> &
      Schema.Attribute.DefaultTo<'semanal'>;
    price: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    quotaAmount: Schema.Attribute.Decimal;
    seller: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    signedAt: Schema.Attribute.Date;
    status: Schema.Attribute.Enumeration<['pendiente', 'firmado', 'archivado']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pendiente'>;
    summary: Schema.Attribute.Text;
    title: Schema.Attribute.String;
    totalQuotas: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<220>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiDriverHistoryDriverHistory extends Struct.CollectionTypeSchema {
  collectionName: 'driver_histories';
  info: {
    description: 'Historial de conductores asignados a veh\u00EDculos';
    displayName: 'Driver History';
    pluralName: 'driver-histories';
    singularName: 'driver-history';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    driver: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    endDate: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::driver-history.driver-history'> &
      Schema.Attribute.Private;
    mileageEnd: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    mileageStart: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    startDate: Schema.Attribute.Date & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['active', 'completed', 'suspended']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'active'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiFinancingFinancing extends Struct.CollectionTypeSchema {
  collectionName: 'financings';
  info: {
    description: 'Plan de financiamiento vehicular (Pago Padre)';
    displayName: 'Financing';
    pluralName: 'financings';
    singularName: 'financing';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    client: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    currentBalance: Schema.Attribute.Decimal & Schema.Attribute.Required;
    financingMonths: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 120;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<54>;
    financingNumber: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    invoices: Schema.Attribute.Relation<'oneToMany', 'api::invoice.invoice'>;
    lateFeePercentage: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<10>;
    lateQuotasCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::financing.financing'> &
      Schema.Attribute.Private;
    maxLateQuotasAllowed: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<4>;
    nextDueDate: Schema.Attribute.Date;
    notes: Schema.Attribute.Text;
    paidQuotas: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    partialPaymentCredit: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    paymentFrequency: Schema.Attribute.Enumeration<['semanal', 'quincenal', 'mensual']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'semanal'>;
    payments: Schema.Attribute.Relation<'oneToMany', 'api::billing-record.billing-record'>;
    penaltyDebts: Schema.Attribute.Relation<'oneToMany', 'api::penalty-debt.penalty-debt'>;
    publishedAt: Schema.Attribute.DateTime;
    quotaAmount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    startDate: Schema.Attribute.Date & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['activo', 'inactivo', 'en_mora', 'completado']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'activo'>;
    totalAmount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    totalLateFees: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalPaid: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalQuotas: Schema.Attribute.Integer & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'oneToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiFleetDocumentTypeFleetDocumentType extends Struct.CollectionTypeSchema {
  collectionName: 'fleet_document_types';
  info: {
    description: 'Tipos de documentos disponibles para los veh\u00EDculos';
    displayName: 'Tipo de Documento de Veh\u00EDculo';
    pluralName: 'fleet-document-types';
    singularName: 'fleet-document-type';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    documents: Schema.Attribute.Relation<'oneToMany', 'api::fleet-document.fleet-document'>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::fleet-document-type.fleet-document-type'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiFleetDocumentFleetDocument extends Struct.CollectionTypeSchema {
  collectionName: 'fleet_documents';
  info: {
    description: 'Documentos del veh\u00EDculo (p\u00F3liza de seguro, ficha t\u00E9cnica, tarjeta de propiedad, etc.)';
    displayName: 'Fleet Document';
    pluralName: 'fleet-documents';
    singularName: 'fleet-document';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    authorDocumentId: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    documentType: Schema.Attribute.Relation<
      'manyToOne',
      'api::fleet-document-type.fleet-document-type'
    > &
      Schema.Attribute.Required;
    files: Schema.Attribute.Media<'files' | 'images', true> & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::fleet-document.fleet-document'> &
      Schema.Attribute.Private;
    otherDescription: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiFleetMileageHistoryFleetMileageHistory extends Struct.CollectionTypeSchema {
  collectionName: 'fleet_mileage_histories';
  info: {
    description: 'Historial de cambios de kilometraje y registros de cambio de aceite';
    displayName: 'Fleet Mileage History';
    pluralName: 'fleet-mileage-histories';
    singularName: 'fleet-mileage-history';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    changeType: Schema.Attribute.Enumeration<['mileage_update', 'oil_change_reset']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'mileage_update'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    createdByName: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::fleet-mileage-history.fleet-mileage-history'
    > &
      Schema.Attribute.Private;
    newMileage: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    notes: Schema.Attribute.Text;
    previousMileage: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiFleetNoteFleetNote extends Struct.CollectionTypeSchema {
  collectionName: 'fleet_notes';
  info: {
    description: 'Notas vinculadas a veh\u00EDculos de la flota';
    displayName: 'Fleet Note';
    pluralName: 'fleet-notes';
    singularName: 'fleet-note';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    authorDocumentId: Schema.Attribute.String & Schema.Attribute.Required;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::fleet-note.fleet-note'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiFleetReminderFleetReminder extends Struct.CollectionTypeSchema {
  collectionName: 'fleet_reminders';
  info: {
    description: 'Recordatorios para veh\u00EDculos (\u00FAnicos o recurrentes)';
    displayName: 'Fleet Reminder';
    pluralName: 'fleet-reminders';
    singularName: 'fleet-reminder';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assignedUsers: Schema.Attribute.Relation<'manyToMany', 'api::user-profile.user-profile'>;
    authorDocumentId: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    isCompleted: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lastTriggered: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::fleet-reminder.fleet-reminder'> &
      Schema.Attribute.Private;
    mileageNotificationSent: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    mileageThreshold: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    nextTrigger: Schema.Attribute.DateTime & Schema.Attribute.Required;
    notificationType: Schema.Attribute.Enumeration<
      ['oil_change', 'maintenance', 'inspection', 'tire_rotation', 'other']
    > &
      Schema.Attribute.DefaultTo<'other'>;
    publishedAt: Schema.Attribute.DateTime;
    recurrenceEndDate: Schema.Attribute.DateTime;
    recurrencePattern: Schema.Attribute.Enumeration<
      ['daily', 'weekly', 'biweekly', 'monthly', 'yearly']
    >;
    reminderType: Schema.Attribute.Enumeration<['unique', 'recurring']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'unique'>;
    scheduledDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiFleetStatusFleetStatus extends Struct.CollectionTypeSchema {
  collectionName: 'fleet_statuses';
  info: {
    description: 'Estados del veh\u00EDculo con im\u00E1genes para seguimiento del estado al momento de entregarlo';
    displayName: 'Fleet Status';
    pluralName: 'fleet-statuses';
    singularName: 'fleet-status';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    authorDocumentId: Schema.Attribute.String & Schema.Attribute.Required;
    comment: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    images: Schema.Attribute.Media<'images', true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::fleet-status.fleet-status'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiFleetFleet extends Struct.CollectionTypeSchema {
  collectionName: 'fleets';
  info: {
    description: 'Gesti\u00F3n de veh\u00EDculos en la flota';
    displayName: 'Fleet';
    pluralName: 'fleets';
    singularName: 'fleet';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    appointments: Schema.Attribute.Relation<'oneToMany', 'api::appointment.appointment'>;
    assignedDrivers: Schema.Attribute.Relation<'manyToMany', 'api::user-profile.user-profile'>;
    billingInitials: Schema.Attribute.String;
    brand: Schema.Attribute.String & Schema.Attribute.Required;
    color: Schema.Attribute.String;
    condition: Schema.Attribute.Enumeration<['nuevo', 'usado', 'seminuevo']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'nuevo'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    currentDrivers: Schema.Attribute.Relation<'manyToMany', 'api::user-profile.user-profile'>;
    currentMileage: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    deals: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'>;
    documents: Schema.Attribute.Relation<'oneToMany', 'api::fleet-document.fleet-document'>;
    driverHistory: Schema.Attribute.Relation<'oneToMany', 'api::driver-history.driver-history'>;
    engineNumber: Schema.Attribute.String;
    financing: Schema.Attribute.Relation<'oneToOne', 'api::financing.financing'>;
    fuelType: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    imageAlt: Schema.Attribute.String;
    interestedDrivers: Schema.Attribute.Relation<'manyToMany', 'api::user-profile.user-profile'>;
    interestedPersons: Schema.Attribute.Relation<'manyToMany', 'api::client.client'>;
    lastOilChangeMileage: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::fleet.fleet'> &
      Schema.Attribute.Private;
    mileageHistory: Schema.Attribute.Relation<
      'oneToMany',
      'api::fleet-mileage-history.fleet-mileage-history'
    >;
    model: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    nextMaintenanceDate: Schema.Attribute.Date;
    notes: Schema.Attribute.Relation<'oneToMany', 'api::fleet-note.fleet-note'>;
    notifications: Schema.Attribute.Relation<'oneToMany', 'api::notification.notification'>;
    oilChangeInterval: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<5000>;
    oilChangeNotificationSent: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    oilChangeWarningSent: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    passengerCapacity: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    placa: Schema.Attribute.String;
    preferredBy: Schema.Attribute.Relation<'oneToOne', 'api::client.client'>;
    price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    reminders: Schema.Attribute.Relation<'oneToMany', 'api::fleet-reminder.fleet-reminder'>;
    responsables: Schema.Attribute.Relation<'manyToMany', 'api::user-profile.user-profile'>;
    serviceOrders: Schema.Attribute.Relation<'oneToMany', 'api::service-order.service-order'>;
    statuses: Schema.Attribute.Relation<'oneToMany', 'api::fleet-status.fleet-status'>;
    stockQuantity: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    transmission: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicleStates: Schema.Attribute.Relation<'oneToMany', 'api::vehicle-state.vehicle-state'>;
    vin: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    year: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 2100;
          min: 1900;
        },
        number
      >;
  };
}

export interface ApiInventoryItemInventoryItem extends Struct.CollectionTypeSchema {
  collectionName: 'inventory_items';
  info: {
    displayName: 'Inventory Item';
    pluralName: 'inventory-items';
    singularName: 'inventory-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assignedTo: Schema.Attribute.String;
    code: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<['filter', 'disc', 'bolt', 'tire']> &
      Schema.Attribute.DefaultTo<'filter'>;
    inventoryMovements: Schema.Attribute.Relation<
      'oneToMany',
      'api::inventory-movement.inventory-movement'
    >;
    inventoryRequests: Schema.Attribute.Relation<
      'oneToMany',
      'api::inventory-request.inventory-request'
    >;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastRestocked: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::inventory-item.inventory-item'> &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    maintenanceKitItems: Schema.Attribute.Relation<
      'oneToMany',
      'api::maintenance-kit-item.maintenance-kit-item'
    >;
    maxStock: Schema.Attribute.Float;
    minStock: Schema.Attribute.Float;
    notes: Schema.Attribute.Relation<'oneToMany', 'api::inventory-note.inventory-note'>;
    publishedAt: Schema.Attribute.DateTime;
    salePrice: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    serviceOrderInventoryItems: Schema.Attribute.Relation<
      'oneToMany',
      'api::service-order-inventory-item.service-order-inventory-item'
    >;
    serviceOrders: Schema.Attribute.Relation<'manyToMany', 'api::service-order.service-order'>;
    stock: Schema.Attribute.Float & Schema.Attribute.Required & Schema.Attribute.DefaultTo<0>;
    stockStatus: Schema.Attribute.Enumeration<['high', 'medium', 'low']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'medium'>;
    supplier: Schema.Attribute.String;
    unit: Schema.Attribute.String;
    unitCost: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiInventoryMovementInventoryMovement extends Struct.CollectionTypeSchema {
  collectionName: 'inventory_movements';
  info: {
    description: 'Log de auditor\u00EDa de movimientos de inventario (entradas, salidas, ajustes, reversiones)';
    displayName: 'Inventory Movement';
    pluralName: 'inventory-movements';
    singularName: 'inventory-movement';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    date: Schema.Attribute.DateTime & Schema.Attribute.Required;
    inventoryItem: Schema.Attribute.Relation<'manyToOne', 'api::inventory-item.inventory-item'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::inventory-movement.inventory-movement'
    > &
      Schema.Attribute.Private;
    performedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Float &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    reason: Schema.Attribute.String;
    serviceOrder: Schema.Attribute.Relation<'manyToOne', 'api::service-order.service-order'>;
    type: Schema.Attribute.Enumeration<['entrada', 'salida', 'ajuste', 'reversion']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'salida'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiInventoryNoteInventoryNote extends Struct.CollectionTypeSchema {
  collectionName: 'inventory_notes';
  info: {
    displayName: 'Inventory Note';
    pluralName: 'inventory-notes';
    singularName: 'inventory-note';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    author: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    authorName: Schema.Attribute.String;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    item: Schema.Attribute.Relation<'manyToOne', 'api::inventory-item.inventory-item'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::inventory-note.inventory-note'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiInventoryRequestInventoryRequest extends Struct.CollectionTypeSchema {
  collectionName: 'inventory_requests';
  info: {
    description: 'Solicitudes de piezas de inventario por parte de usuarios';
    displayName: 'Inventory Request';
    pluralName: 'inventory-requests';
    singularName: 'inventory-request';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    approvedAt: Schema.Attribute.DateTime;
    approvedBy: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deliveredAt: Schema.Attribute.DateTime;
    inventoryItem: Schema.Attribute.Relation<'manyToOne', 'api::inventory-item.inventory-item'>;
    justification: Schema.Attribute.Text & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::inventory-request.inventory-request'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Float &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0.01;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    requestedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    requester: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    requestNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    status: Schema.Attribute.Enumeration<
      ['pendiente', 'aprobado', 'rechazado', 'entregado', 'cancelado']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pendiente'>;
    unit: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiInvoiceInvoice extends Struct.CollectionTypeSchema {
  collectionName: 'invoices';
  info: {
    description: 'Facturas de financiamiento generadas autom\u00E1ticamente';
    displayName: 'Invoice';
    pluralName: 'invoices';
    singularName: 'invoice';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    billingDate: Schema.Attribute.Date & Schema.Attribute.Required;
    client: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    dueDate: Schema.Attribute.Date & Schema.Attribute.Required;
    financing: Schema.Attribute.Relation<'manyToOne', 'api::financing.financing'>;
    invoiceNumber: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    isSimulated: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::invoice.invoice'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    paymentDate: Schema.Attribute.Date;
    paymentMethod: Schema.Attribute.Enumeration<['cash', 'card', 'transfer', 'yappy', 'otros']>;
    penaltyAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    quotaNumber: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    status: Schema.Attribute.Enumeration<['pending', 'overdue', 'paid', 'cancelled']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pending'>;
    totalAmount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiMaintenanceKitItemMaintenanceKitItem extends Struct.CollectionTypeSchema {
  collectionName: 'maintenance_kit_items';
  info: {
    description: 'L\u00EDneas de repuestos dentro de un kit de mantenimiento';
    displayName: 'Maintenance Kit Item';
    pluralName: 'maintenance-kit-items';
    singularName: 'maintenance-kit-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    inventoryItem: Schema.Attribute.Relation<'manyToOne', 'api::inventory-item.inventory-item'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::maintenance-kit-item.maintenance-kit-item'
    > &
      Schema.Attribute.Private;
    maintenanceKit: Schema.Attribute.Relation<'manyToOne', 'api::maintenance-kit.maintenance-kit'>;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Float &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0.01;
        },
        number
      >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiMaintenanceKitMaintenanceKit extends Struct.CollectionTypeSchema {
  collectionName: 'maintenance_kits';
  info: {
    description: 'Kits de repuestos agrupados por tipo de mantenimiento';
    displayName: 'Maintenance Kit';
    pluralName: 'maintenance-kits';
    singularName: 'maintenance-kit';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    defaultLaborCost: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    description: Schema.Attribute.Text;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    kitItems: Schema.Attribute.Relation<
      'oneToMany',
      'api::maintenance-kit-item.maintenance-kit-item'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::maintenance-kit.maintenance-kit'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    service: Schema.Attribute.Relation<'manyToOne', 'api::service.service'>;
    type: Schema.Attribute.Enumeration<
      ['oil_change', 'preventive', 'corrective', 'tires', 'brakes']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'oil_change'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiNotificationNotification extends Struct.CollectionTypeSchema {
  collectionName: 'notifications';
  info: {
    description: 'Tabla principal para todas las notificaciones y recordatorios del sistema';
    displayName: 'Notification';
    pluralName: 'notifications';
    singularName: 'notification';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assignedUsers: Schema.Attribute.Relation<'manyToMany', 'api::user-profile.user-profile'>;
    author: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    authorDocumentId: Schema.Attribute.String;
    billingRecord: Schema.Attribute.Relation<'manyToOne', 'api::billing-record.billing-record'>;
    client: Schema.Attribute.Relation<'manyToOne', 'api::client.client'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>;
    description: Schema.Attribute.Text;
    durationDays: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 365;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<7>;
    endDate: Schema.Attribute.DateTime;
    expiresAt: Schema.Attribute.DateTime;
    fleetReminder: Schema.Attribute.Relation<'manyToOne', 'api::fleet-reminder.fleet-reminder'>;
    fleetVehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
    images: Schema.Attribute.Media<'images', true>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isCompleted: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isDismissible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isPinned: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isRead: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lastTriggered: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::notification.notification'> &
      Schema.Attribute.Private;
    module: Schema.Attribute.Enumeration<
      ['fleet', 'inventory', 'billing', 'deal', 'client', 'service', 'calendar']
    >;
    nextTrigger: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    recipient: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    recurrenceEndDate: Schema.Attribute.DateTime;
    recurrencePattern: Schema.Attribute.Enumeration<
      ['daily', 'weekly', 'biweekly', 'monthly', 'yearly']
    >;
    reminderType: Schema.Attribute.Enumeration<['unique', 'recurring']>;
    scheduledDate: Schema.Attribute.DateTime;
    startDate: Schema.Attribute.DateTime;
    tags: Schema.Attribute.JSON;
    targetAudience: Schema.Attribute.Enumeration<['all', 'drivers', 'admins']> &
      Schema.Attribute.DefaultTo<'all'>;
    timestamp: Schema.Attribute.DateTime & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      [
        'lead',
        'sale',
        'reminder',
        'payment',
        'inventory',
        'oil_change_reminder',
        'announcement',
        'appointment_created',
        'appointment_cancelled',
        'appointment_rescheduled',
        'appointment_updated',
      ]
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiPaymentApplicationPaymentApplication extends Struct.CollectionTypeSchema {
  collectionName: 'payment_applications';
  info: {
    description: 'Ledger de auditor\u00EDa: rastrea c\u00F3mo un pago (billing-record) se aplica a una deuda (quota o penalidad).';
    displayName: 'Payment Application';
    pluralName: 'payment-applications';
    singularName: 'payment-application';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amountApplied: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    appliedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    debtLeftAfter: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::payment-application.payment-application'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    paymentLeftAfter: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    paymentRecord: Schema.Attribute.Relation<'manyToOne', 'api::billing-record.billing-record'>;
    penaltyDebt: Schema.Attribute.Relation<'manyToOne', 'api::penalty-debt.penalty-debt'>;
    publishedAt: Schema.Attribute.DateTime;
    quotaRecord: Schema.Attribute.Relation<'manyToOne', 'api::billing-record.billing-record'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiPenaltyDebtPenaltyDebt extends Struct.CollectionTypeSchema {
  collectionName: 'penalty_debts';
  info: {
    description: 'Penalidad independiente generada por mora sobre una cuota. Participa en la cola FIFO unificada de deudas.';
    displayName: 'Penalty Debt';
    pluralName: 'penalty-debts';
    singularName: 'penalty-debt';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amountOriginal: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    amountPending: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    applications: Schema.Attribute.Relation<
      'oneToMany',
      'api::payment-application.payment-application'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    dailyRatePercent: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<10>;
    daysAccrued: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    dueDate: Schema.Attribute.Date & Schema.Attribute.Required;
    financing: Schema.Attribute.Relation<'manyToOne', 'api::financing.financing'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::penalty-debt.penalty-debt'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    quotaRecord: Schema.Attribute.Relation<'manyToOne', 'api::billing-record.billing-record'>;
    source: Schema.Attribute.String & Schema.Attribute.DefaultTo<'auto_accrual'>;
    status: Schema.Attribute.Enumeration<['pending', 'partially_paid', 'paid', 'cancelled']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pending'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiRolePermissionRolePermission extends Struct.CollectionTypeSchema {
  collectionName: 'role_permissions';
  info: {
    description: 'Permisos por rol y m\u00F3dulo (matriz editable desde Configuraci\u00F3n)';
    displayName: 'Role Permission';
    pluralName: 'role-permissions';
    singularName: 'role-permission';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    canAccess: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    canCreate: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    canDelete: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    canRead: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    canUpdate: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::role-permission.role-permission'> &
      Schema.Attribute.Private;
    moduleKey: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Enumeration<['admin', 'driver', 'lead']> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiServiceNoteServiceNote extends Struct.CollectionTypeSchema {
  collectionName: 'service_notes';
  info: {
    description: 'Notas vinculadas a servicios o \u00F3rdenes';
    displayName: 'Service Note';
    pluralName: 'service-notes';
    singularName: 'service-note';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    author: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    authorName: Schema.Attribute.String;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::service-note.service-note'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    service: Schema.Attribute.Relation<'manyToOne', 'api::service.service'>;
    serviceOrder: Schema.Attribute.Relation<'manyToOne', 'api::service-order.service-order'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiServiceOrderInventoryItemServiceOrderInventoryItem
  extends Struct.CollectionTypeSchema {
  collectionName: 'service_order_inventory_items';
  info: {
    description: 'L\u00EDneas de repuestos utilizadas en una orden de servicio (collection intermedia)';
    displayName: 'Service Order Inventory Item';
    pluralName: 'service-order-inventory-items';
    singularName: 'service-order-inventory-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    inventoryItem: Schema.Attribute.Relation<'manyToOne', 'api::inventory-item.inventory-item'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::service-order-inventory-item.service-order-inventory-item'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Float &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0.01;
        },
        number
      >;
    serviceOrder: Schema.Attribute.Relation<'manyToOne', 'api::service-order.service-order'>;
    totalLine: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    unitPriceAtMoment: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiServiceOrderServiceOrder extends Struct.CollectionTypeSchema {
  collectionName: 'service_orders';
  info: {
    description: '\u00D3rdenes de servicio y mantenimiento';
    displayName: 'Service Order';
    pluralName: 'service-orders';
    singularName: 'service-order';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    appointment: Schema.Attribute.Relation<'oneToOne', 'api::appointment.appointment'>;
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    completedAt: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    driver: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    inventoryItems: Schema.Attribute.Relation<'manyToMany', 'api::inventory-item.inventory-item'>;
    inventoryMovements: Schema.Attribute.Relation<
      'oneToMany',
      'api::inventory-movement.inventory-movement'
    >;
    laborCost: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::service-order.service-order'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Relation<'oneToMany', 'api::service-note.service-note'>;
    partsCost: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    serviceOrderInventoryItems: Schema.Attribute.Relation<
      'oneToMany',
      'api::service-order-inventory-item.service-order-inventory-item'
    >;
    services: Schema.Attribute.Relation<'manyToMany', 'api::service.service'>;
    status: Schema.Attribute.Enumeration<['pendiente', 'en_progreso', 'completado', 'cancelado']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pendiente'>;
    summary: Schema.Attribute.Text;
    taxAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalCost: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiServiceService extends Struct.CollectionTypeSchema {
  collectionName: 'services';
  info: {
    description: 'Cat\u00E1logo de servicios y mantenimientos';
    displayName: 'Service';
    pluralName: 'services';
    singularName: 'service';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    agencyCost: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    appointments: Schema.Attribute.Relation<'oneToMany', 'api::appointment.appointment'>;
    basePrice: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    category: Schema.Attribute.String;
    coverage: Schema.Attribute.Enumeration<['cliente', 'empresa']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'cliente'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    defaultTemplate: Schema.Attribute.JSON;
    description: Schema.Attribute.Text;
    durationMinutes: Schema.Attribute.Integer;
    isFree: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::service.service'> &
      Schema.Attribute.Private;
    maintenanceKits: Schema.Attribute.Relation<'oneToMany', 'api::maintenance-kit.maintenance-kit'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    notes: Schema.Attribute.Relation<'oneToMany', 'api::service-note.service-note'>;
    orders: Schema.Attribute.Relation<'manyToMany', 'api::service-order.service-order'>;
    price: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<'0'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiSignupSignup extends Struct.SingleTypeSchema {
  collectionName: 'signups';
  info: {
    displayName: 'Sign Up';
    pluralName: 'signups';
    singularName: 'signup';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    Description: Schema.Attribute.Text;
    header: Schema.Attribute.Component<'metada.header', true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::signup.signup'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sections: Schema.Attribute.DynamicZone<['layout.singup-form']>;
    Title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiSinginSingin extends Struct.SingleTypeSchema {
  collectionName: 'singins';
  info: {
    displayName: 'Sign In';
    pluralName: 'singins';
    singularName: 'singin';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String;
    header: Schema.Attribute.Component<'metada.header', false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::singin.singin'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sections: Schema.Attribute.DynamicZone<['layout.singin-form']>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiStatEntryStatEntry extends Struct.CollectionTypeSchema {
  collectionName: 'stat_entries';
  info: {
    displayName: 'Stat Entry';
    pluralName: 'stat-entries';
    singularName: 'stat-entry';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    appointmentsCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    dailyBreakdown: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::stat-entry.stat-entry'> &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    publishedAt: Schema.Attribute.DateTime;
    salesAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<'0'>;
    servicesAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<'0'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    weekRange: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiSupplyItemSupplyItem extends Struct.CollectionTypeSchema {
  collectionName: 'supply_items';
  info: {
    description: 'Cat\u00E1logo de insumos b\u00E1sicos con control de stock';
    displayName: 'Supply Item';
    pluralName: 'supply-items';
    singularName: 'supply-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.Enumeration<['package', 'fuel', 'droplet', 'box']> &
      Schema.Attribute.DefaultTo<'box'>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::supply-item.supply-item'> &
      Schema.Attribute.Private;
    minStock: Schema.Attribute.Float &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<5>;
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    requests: Schema.Attribute.Relation<'oneToMany', 'api::supply-request.supply-request'>;
    stock: Schema.Attribute.Float &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    type: Schema.Attribute.Enumeration<['kit_limpieza', 'gasolina', 'aceite', 'otros']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'otros'>;
    unit: Schema.Attribute.Enumeration<['unidades', 'litros', 'galones', 'kits']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'unidades'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiSupplyRequestSupplyRequest extends Struct.CollectionTypeSchema {
  collectionName: 'supply_requests';
  info: {
    description: 'Solicitudes de insumos b\u00E1sicos por parte de usuarios';
    displayName: 'Supply Request';
    pluralName: 'supply-requests';
    singularName: 'supply-request';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    approvedAt: Schema.Attribute.DateTime;
    approvedBy: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deliveredAt: Schema.Attribute.DateTime;
    justification: Schema.Attribute.Text & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::supply-request.supply-request'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    requestedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    requester: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    requestNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    status: Schema.Attribute.Enumeration<
      ['pendiente', 'aprobado', 'rechazado', 'entregado', 'cancelado']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pendiente'>;
    supplyItem: Schema.Attribute.Relation<'manyToOne', 'api::supply-item.supply-item'>;
    type: Schema.Attribute.Enumeration<['kit_limpieza', 'gasolina', 'aceite', 'otros']> &
      Schema.Attribute.Required;
    unit: Schema.Attribute.Enumeration<['unidades', 'litros', 'galones', 'kits']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'unidades'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiUserCommentUserComment extends Struct.CollectionTypeSchema {
  collectionName: 'user_comments';
  info: {
    description: "Free-form comments shown as a timeline on a contact's detail page";
    displayName: 'User Comment';
    pluralName: 'user-comments';
    singularName: 'user-comment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    authorDocumentId: Schema.Attribute.String & Schema.Attribute.Required;
    authorName: Schema.Attribute.String;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::user-comment.user-comment'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiUserProfileUserProfile extends Struct.CollectionTypeSchema {
  collectionName: 'user_profiles';
  info: {
    description: 'Perfiles extendidos para los roles internos';
    displayName: 'User Profile';
    pluralName: 'user-profiles';
    singularName: 'user-profile';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address: Schema.Attribute.Text;
    appointments: Schema.Attribute.Relation<'oneToMany', 'api::appointment.appointment'>;
    approvedInventoryRequests: Schema.Attribute.Relation<
      'oneToMany',
      'api::inventory-request.inventory-request'
    >;
    approvedSupplyRequests: Schema.Attribute.Relation<
      'oneToMany',
      'api::supply-request.supply-request'
    >;
    assignedNotifications: Schema.Attribute.Relation<
      'manyToMany',
      'api::notification.notification'
    >;
    assignedReminders: Schema.Attribute.Relation<
      'manyToMany',
      'api::fleet-reminder.fleet-reminder'
    >;
    assignedVehicles: Schema.Attribute.Relation<'manyToMany', 'api::fleet.fleet'>;
    avatar: Schema.Attribute.Media<'images'>;
    billingAddress: Schema.Attribute.String;
    billingName: Schema.Attribute.String;
    billingPhone: Schema.Attribute.String;
    billingTaxId: Schema.Attribute.String;
    bio: Schema.Attribute.Text;
    clients: Schema.Attribute.Relation<'oneToMany', 'api::client.client'>;
    comments: Schema.Attribute.Relation<'oneToMany', 'api::user-comment.user-comment'>;
    communicationLogs: Schema.Attribute.Relation<
      'oneToMany',
      'api::communication-log.communication-log'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    dateOfBirth: Schema.Attribute.Date;
    deals: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'>;
    department: Schema.Attribute.String;
    displayName: Schema.Attribute.String & Schema.Attribute.Required;
    driverHistories: Schema.Attribute.Relation<'oneToMany', 'api::driver-history.driver-history'>;
    driverLicense: Schema.Attribute.String;
    email: Schema.Attribute.Email;
    emergencyContactName: Schema.Attribute.String;
    emergencyContactPhone: Schema.Attribute.String;
    financings: Schema.Attribute.Relation<'oneToMany', 'api::financing.financing'>;
    hireDate: Schema.Attribute.Date;
    identificationNumber: Schema.Attribute.String;
    interestedVehicles: Schema.Attribute.Relation<'manyToMany', 'api::fleet.fleet'>;
    inventoryNotes: Schema.Attribute.Relation<'oneToMany', 'api::inventory-note.inventory-note'>;
    inventoryRequests: Schema.Attribute.Relation<
      'oneToMany',
      'api::inventory-request.inventory-request'
    >;
    linkedin: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::user-profile.user-profile'> &
      Schema.Attribute.Private;
    notifications: Schema.Attribute.Relation<'oneToMany', 'api::notification.notification'>;
    password: Schema.Attribute.Password & Schema.Attribute.Private;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registeredVehicles: Schema.Attribute.Relation<'oneToMany', 'api::fleet.fleet'>;
    role: Schema.Attribute.Enumeration<['admin', 'driver', 'lead']> & Schema.Attribute.Required;
    serviceNotes: Schema.Attribute.Relation<'oneToMany', 'api::service-note.service-note'>;
    serviceOrders: Schema.Attribute.Relation<'oneToMany', 'api::service-order.service-order'>;
    specialties: Schema.Attribute.Text;
    supplyRequests: Schema.Attribute.Relation<'oneToMany', 'api::supply-request.supply-request'>;
    themePreference: Schema.Attribute.Enumeration<['light', 'dark', 'system']> &
      Schema.Attribute.DefaultTo<'light'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    userAccount: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'> &
      Schema.Attribute.Private;
    workSchedule: Schema.Attribute.String;
  };
}

export interface ApiVehicleDocumentCategoryVehicleDocumentCategory
  extends Struct.CollectionTypeSchema {
  collectionName: 'vehicle_document_categories';
  info: {
    description: 'Tipos y categor\u00EDas maestras de documentos para veh\u00EDculos';
    displayName: 'Categor\u00EDa de Documento Vehicular';
    pluralName: 'vehicle-document-categories';
    singularName: 'vehicle-document-category';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::vehicle-document-category.vehicle-document-category'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    templateFile: Schema.Attribute.Media<'files' | 'images'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiVehicleDocumentVehicleDocument extends Struct.CollectionTypeSchema {
  collectionName: 'vehicle_documents';
  info: {
    description: 'Documentos y evidencia fotogr\u00E1fica de un veh\u00EDculo espec\u00EDfico';
    displayName: 'Documento Vehicular';
    pluralName: 'vehicle-documents';
    singularName: 'vehicle-document';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    category: Schema.Attribute.Relation<
      'manyToOne',
      'api::vehicle-document-category.vehicle-document-category'
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    expirationDate: Schema.Attribute.Date;
    files: Schema.Attribute.Media<'files' | 'images', true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::vehicle-document.vehicle-document'
    > &
      Schema.Attribute.Private;
    photos: Schema.Attribute.Media<'images', true>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicleDocumentId: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiVehicleStateVehicleState extends Struct.CollectionTypeSchema {
  collectionName: 'vehicle_states';
  info: {
    description: 'Estados del veh\u00EDculo con im\u00E1genes y comentarios';
    displayName: 'Vehicle State';
    pluralName: 'vehicle-states';
    singularName: 'vehicle-state';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    authorDocumentId: Schema.Attribute.String & Schema.Attribute.Required;
    comment: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    images: Schema.Attribute.Media<'images', true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::vehicle-state.vehicle-state'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::fleet.fleet'>;
  };
}

export interface ApiWeeklyCollectionWeeklyCollection extends Struct.CollectionTypeSchema {
  collectionName: 'weekly_collections';
  info: {
    description: 'Registros de cobranza semanal importados masivamente desde Excel/CSV';
    displayName: 'Cobranza Semanal';
    pluralName: 'weekly-collections';
    singularName: 'weekly-collection';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amountPaid: Schema.Attribute.Decimal;
    client: Schema.Attribute.Relation<'manyToOne', 'api::user-profile.user-profile'>;
    clientIdentification: Schema.Attribute.String;
    clientName: Schema.Attribute.String;
    confirmationNumber: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    financing: Schema.Attribute.Relation<'manyToOne', 'api::financing.financing'>;
    importBatch: Schema.Attribute.String;
    importError: Schema.Attribute.Text;
    importStatus: Schema.Attribute.Enumeration<['pending', 'processed', 'error', 'duplicate']> &
      Schema.Attribute.DefaultTo<'pending'>;
    initialDeposit: Schema.Attribute.Decimal;
    lateFee: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::weekly-collection.weekly-collection'
    > &
      Schema.Attribute.Private;
    paymentDate: Schema.Attribute.Date;
    publishedAt: Schema.Attribute.DateTime;
    receiptDate: Schema.Attribute.Date;
    receiptNumber: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    remainingBalance: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    verifiedInBank: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    weeklyQuota: Schema.Attribute.Decimal;
    weekNumber: Schema.Attribute.Integer;
  };
}

export interface PluginContentReleasesRelease extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<'oneToMany', 'plugin::content-releases.release-action'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::content-releases.release'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['ready', 'blocked', 'failed', 'done', 'empty']> &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<'manyToOne', 'plugin::content-releases.release'>;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::i18n.locale'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::review-workflows.workflow'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<'oneToMany', 'plugin::review-workflows.workflow-stage'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<'manyToOne', 'plugin::review-workflows.workflow'>;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'> &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.permission'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.role'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.permission'>;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'>;
  };
}

export interface PluginUsersPermissionsUser extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    isValidated: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.role'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    validatedAt: Schema.Attribute.DateTime;
    validationMethod: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::appointment.appointment': ApiAppointmentAppointment;
      'api::billing-document.billing-document': ApiBillingDocumentBillingDocument;
      'api::billing-record.billing-record': ApiBillingRecordBillingRecord;
      'api::client.client': ApiClientClient;
      'api::communication-log.communication-log': ApiCommunicationLogCommunicationLog;
      'api::company-info.company-info': ApiCompanyInfoCompanyInfo;
      'api::configuration.configuration': ApiConfigurationConfiguration;
      'api::contract-document.contract-document': ApiContractDocumentContractDocument;
      'api::contract-type.contract-type': ApiContractTypeContractType;
      'api::dashboard-metric.dashboard-metric': ApiDashboardMetricDashboardMetric;
      'api::dashboard.dashboard': ApiDashboardDashboard;
      'api::deal-clause.deal-clause': ApiDealClauseDealClause;
      'api::deal-discount.deal-discount': ApiDealDiscountDealDiscount;
      'api::deal.deal': ApiDealDeal;
      'api::driver-history.driver-history': ApiDriverHistoryDriverHistory;
      'api::financing.financing': ApiFinancingFinancing;
      'api::fleet-document-type.fleet-document-type': ApiFleetDocumentTypeFleetDocumentType;
      'api::fleet-document.fleet-document': ApiFleetDocumentFleetDocument;
      'api::fleet-mileage-history.fleet-mileage-history': ApiFleetMileageHistoryFleetMileageHistory;
      'api::fleet-note.fleet-note': ApiFleetNoteFleetNote;
      'api::fleet-reminder.fleet-reminder': ApiFleetReminderFleetReminder;
      'api::fleet-status.fleet-status': ApiFleetStatusFleetStatus;
      'api::fleet.fleet': ApiFleetFleet;
      'api::inventory-item.inventory-item': ApiInventoryItemInventoryItem;
      'api::inventory-movement.inventory-movement': ApiInventoryMovementInventoryMovement;
      'api::inventory-note.inventory-note': ApiInventoryNoteInventoryNote;
      'api::inventory-request.inventory-request': ApiInventoryRequestInventoryRequest;
      'api::invoice.invoice': ApiInvoiceInvoice;
      'api::maintenance-kit-item.maintenance-kit-item': ApiMaintenanceKitItemMaintenanceKitItem;
      'api::maintenance-kit.maintenance-kit': ApiMaintenanceKitMaintenanceKit;
      'api::notification.notification': ApiNotificationNotification;
      'api::payment-application.payment-application': ApiPaymentApplicationPaymentApplication;
      'api::penalty-debt.penalty-debt': ApiPenaltyDebtPenaltyDebt;
      'api::role-permission.role-permission': ApiRolePermissionRolePermission;
      'api::service-note.service-note': ApiServiceNoteServiceNote;
      'api::service-order-inventory-item.service-order-inventory-item': ApiServiceOrderInventoryItemServiceOrderInventoryItem;
      'api::service-order.service-order': ApiServiceOrderServiceOrder;
      'api::service.service': ApiServiceService;
      'api::signup.signup': ApiSignupSignup;
      'api::singin.singin': ApiSinginSingin;
      'api::stat-entry.stat-entry': ApiStatEntryStatEntry;
      'api::supply-item.supply-item': ApiSupplyItemSupplyItem;
      'api::supply-request.supply-request': ApiSupplyRequestSupplyRequest;
      'api::user-comment.user-comment': ApiUserCommentUserComment;
      'api::user-profile.user-profile': ApiUserProfileUserProfile;
      'api::vehicle-document-category.vehicle-document-category': ApiVehicleDocumentCategoryVehicleDocumentCategory;
      'api::vehicle-document.vehicle-document': ApiVehicleDocumentVehicleDocument;
      'api::vehicle-state.vehicle-state': ApiVehicleStateVehicleState;
      'api::weekly-collection.weekly-collection': ApiWeeklyCollectionWeeklyCollection;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
