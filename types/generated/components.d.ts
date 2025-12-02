import type { Schema, Struct } from '@strapi/strapi';

export interface ComponentLink extends Struct.ComponentSchema {
  collectionName: 'components_component_links';
  info: {
    displayName: 'link';
    icon: 'link';
  };
  attributes: {
    href: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'#'>;
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LayoutHeaderSection extends Struct.ComponentSchema {
  collectionName: 'components_layout_header_sections';
  info: {
    displayName: 'header_section';
    icon: 'headphone';
  };
  attributes: {
    subtitle: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LayoutHeroSection extends Struct.ComponentSchema {
  collectionName: 'components_layout_hero_sections';
  info: {
    displayName: 'Hero Section';
    icon: 'alien';
  };
  attributes: {
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images' | 'files'> &
      Schema.Attribute.Required;
    link: Schema.Attribute.Component<'component.link', false> &
      Schema.Attribute.Required;
    sub_heading: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface LayoutSinginForm extends Struct.ComponentSchema {
  collectionName: 'components_layout_singin_forms';
  info: {
    displayName: 'singin_form';
  };
  attributes: {
    email_label: Schema.Attribute.String & Schema.Attribute.Required;
    email_placeholder: Schema.Attribute.String & Schema.Attribute.Required;
    header: Schema.Attribute.Component<'layout.header-section', false>;
    password_label: Schema.Attribute.String & Schema.Attribute.Required;
    password_placeholder: Schema.Attribute.String & Schema.Attribute.Required;
    singup_link: Schema.Attribute.Component<'component.link', true>;
    singup_previous_link_text: Schema.Attribute.String &
      Schema.Attribute.Required;
    submit_button: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LayoutSingupForm extends Struct.ComponentSchema {
  collectionName: 'components_layout_singup_forms';
  info: {
    displayName: 'singup_form';
    icon: 'apps';
  };
  attributes: {
    email_label: Schema.Attribute.String & Schema.Attribute.Required;
    email_placeholder: Schema.Attribute.String & Schema.Attribute.Required;
    header: Schema.Attribute.Component<'layout.header-section', false> &
      Schema.Attribute.Required;
    password_label: Schema.Attribute.String & Schema.Attribute.Required;
    password_placeholder: Schema.Attribute.String & Schema.Attribute.Required;
    singin_link: Schema.Attribute.Component<'component.link', true> &
      Schema.Attribute.Required;
    singin_previous_link_text: Schema.Attribute.String &
      Schema.Attribute.Required;
    submit_buton: Schema.Attribute.String & Schema.Attribute.Required;
    username_label: Schema.Attribute.String & Schema.Attribute.Required;
    username_placeholder: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MetadaHeader extends Struct.ComponentSchema {
  collectionName: 'components_metada_headers';
  info: {
    displayName: 'header';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    favicon: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'component.link': ComponentLink;
      'layout.header-section': LayoutHeaderSection;
      'layout.hero-section': LayoutHeroSection;
      'layout.singin-form': LayoutSinginForm;
      'layout.singup-form': LayoutSingupForm;
      'metada.header': MetadaHeader;
    }
  }
}
