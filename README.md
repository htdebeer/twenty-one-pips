
Twenty-one-pips is a JavaScript *dice game engine*. It is still being
developed and there has been no release yet.

- license: LGPL3.0

Twenty-one-pips is still very much a work in progress. There has been no
release yet and large parts aren't finished yet. I am still developing it
without regards for deployment, using ES6 modules, the shadow dom, and
custom elements. Once the project is release-worthy, I'l look into deployment
on any browser using polyfills.

To configure Firefox to run the examples, configure the following options via
`about:config` (from
[MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements):

- Set `dom.webcomponents.shadowdom.enabled` to `true`
- Set `dom.webcomponents.customelements.enabled` to `true`

# Observations

- Apparently, it looks like using elements from within a shadow dom is
  [problematic](https://github.com/w3c/webcomponents/issues/179). As a
  workaround, the SVG definitions are pulled outside the component.
- The behavior of creating Custom Components on Chrome and Firefox is slightly
  different. The current code does not seem to run on Chrome.
- Somehow Firefox freezes when I am interacting with dice. It looks like the
  issues with SVG in the shadow dom are even worse.

