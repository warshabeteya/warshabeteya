/* Public settings. Never put passwords, API keys or secrets here. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WarshaConfig=factory();})(globalThis,()=>({
  promotionsEnabled: false,
  analyticsEnabled: true,
  // Leave empty for the GitHub Pages / WhatsApp workflow.
  // After deploying the included server: 'https://YOUR-SERVER/quote'
  validationEndpoint: ''
}));
