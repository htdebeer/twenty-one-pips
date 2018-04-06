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
    <symbol id="hold" transform="translate(-10.25, -10.25)scale(0.5)">
        <circle cx="72.21" cy="72.21" r="70.71" fill="inherit"/>
    </symbol>
    <symbol id="die_1" transform="scale(0.5)">
      <use x="0" y="0" xlink:href="#die-shape" />
      <use x="40" y="40" xlink:href="#pip" />
    </symbol>
    <symbol id="die_2" transform="scale(0.5)">
      <use x="0" y="0" xlink:href="#die-shape" />
      <use x="20" y="20" xlink:href="#pip" />
      <use x="60" y="60" xlink:href="#pip" />
    </symbol>
    <symbol id="die_3" transform="scale(0.5)">
      <use x="0" y="0" xlink:href="#die-shape" />
      <use x="20" y="20" xlink:href="#pip" />
      <use x="40" y="40" xlink:href="#pip" />
      <use x="60" y="60" xlink:href="#pip" />
    </symbol>
    <symbol id="die_4" transform="scale(0.5)">
      <use x="0" y="0" xlink:href="#die-shape" />
      <use x="20" y="20" xlink:href="#pip" />
      <use x="60" y="20" xlink:href="#pip" />
      <use x="20" y="60" xlink:href="#pip" />
      <use x="60" y="60" xlink:href="#pip" />
    </symbol>
    <symbol id="die_5" transform="scale(0.5)">
      <use x="0" y="0" xlink:href="#die-shape" />
      <use x="20" y="20" xlink:href="#pip" />
      <use x="60" y="20" xlink:href="#pip" />
      <use x="20" y="60" xlink:href="#pip" />
      <use x="60" y="60" xlink:href="#pip" />
      <use x="40" y="40" xlink:href="#pip" />
    </symbol>
    <symbol id="die_6" transform="scale(0.5)">
      <use x="0" y="0" xlink:href="#die-shape" />
      <use x="20" y="15" xlink:href="#pip" />
      <use x="60" y="15" xlink:href="#pip" />
      <use x="20" y="65" xlink:href="#pip" />
      <use x="60" y="65" xlink:href="#pip" />
      <use x="20" y="40" xlink:href="#pip" />
      <use x="60" y="40" xlink:href="#pip" />
    </symbol>
  </defs>
</svg>`;
