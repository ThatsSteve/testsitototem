/* Site configuration: the only file to edit for links that may change. */
window.TOTEM_CONFIG = {
  // Destination of every "Configure" button, per model.
  // TODO: replace with the real configurator URLs (the current site opens its configurator from the model pages).
  configurator: {
    'gt-electric': 'https://totemautomobili.com/gt-electric',
    'gt-super': 'https://totemautomobili.com/gt-super'
  },
  configuratorFallback: 'https://totemautomobili.com/',
  contact: { email: 'info@totemautomobili.com' },
  // Optional: a form service endpoint (Formspree, Netlify Forms, Basin...). Empty = the form opens the visitor's e-mail app.
  formEndpoint: ''
};
