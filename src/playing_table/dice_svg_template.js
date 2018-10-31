export default `<?xml version="1.0" standalone="yes"?> <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="1000">
  <defs>
    <symbol id="die-shape" overflow="visible">
      <rect x="1.5" y="1.5" rx="10" ry="10" width="100" height="100"
      fill="inherit" stroke="black" stroke-width="3" />
    </symbol>
    <linearGradient id="dimple">
      <stop offset="1%" stop-color="black" />
      <stop offset="60%" stop-color="dimgray" />
      <stop offset="100%" stop-color="white" />
    </linearGradient>
    <symbol id="pip">
      <circle cx="11" cy="11" r="10" fill="black"/>
      <circle cx="11" cy="11" r="10" fill="url(#dimple)"
      fill-opacity="0.6"
      stroke="black" 
      stroke-width="1"
      transform="rotate(-25,10,10)" 
      />
    </symbol>
    <symbol id="hold">
        <circle cx="72.21" cy="72.21" r="72.21" fill="inherit"/>
    </symbol>
    <symbol id="die_1">
      <use x="20.25" y="20.25" xlink:href="#die-shape" />
      <use x="60.25" y="60.25" xlink:href="#pip" />
    </symbol>
    <symbol id="die_2">
      <use x="20.25" y="20.25" xlink:href="#die-shape" />
      <use x="40.25" y="40.25" xlink:href="#pip" />
      <use x="80.25" y="80.25" xlink:href="#pip" />
    </symbol>
    <symbol id="die_3">
      <use x="20.25" y="20.25" xlink:href="#die-shape" />
      <use x="40.25" y="40.25" xlink:href="#pip" />
      <use x="60.25" y="60.25" xlink:href="#pip" />
      <use x="80.25" y="80.25" xlink:href="#pip" />
    </symbol>
    <symbol id="die_4">
      <use x="20.25" y="20.25" xlink:href="#die-shape" />
      <use x="40.25" y="40.25" xlink:href="#pip" />
      <use x="80.25" y="40.25" xlink:href="#pip" />
      <use x="40.25" y="80.25" xlink:href="#pip" />
      <use x="80.25" y="80.25" xlink:href="#pip" />
    </symbol>
    <symbol id="die_5">
      <use x="20.25" y="20.25" xlink:href="#die-shape" />
      <use x="40.25" y="40.25" xlink:href="#pip" />
      <use x="80.25" y="40.25" xlink:href="#pip" />
      <use x="40.25" y="80.25" xlink:href="#pip" />
      <use x="80.25" y="80.25" xlink:href="#pip" />
      <use x="60.25" y="60.25" xlink:href="#pip" />
    </symbol>
    <symbol id="die_6">
      <use x="20.25" y="20.25" xlink:href="#die-shape" />
      <use x="40.25" y="35.25" xlink:href="#pip" />
      <use x="80.25" y="35.25" xlink:href="#pip" />
      <use x="40.25" y="85.25" xlink:href="#pip" />
      <use x="80.25" y="85.25" xlink:href="#pip" />
      <use x="40.25" y="60.25" xlink:href="#pip" />
      <use x="80.25" y="60.25" xlink:href="#pip" />
    </symbol>
  </defs>
</svg>`;
