import React, { use } from 'react';
import CreateFeature from '../../items/Admin/Features/CreateFeature';
import FeaturesTable from '../../items/Admin/Features/FeaturesTable';
import { useState } from 'react';
import { useEffect } from 'react';
export default function Features() {
  
  const [toggle, setToggle] = useState(false);


  return (
    <div className="container mt-5">
      <h1>Features Page</h1>
      <p>This is the features page where you can manage your features.</p>
      <CreateFeature toggle={toggle} setToggle={setToggle} />
      <FeaturesTable toggle={toggle} setToggle={setToggle} />
      {/* Add more content or components as needed */}
    </div>
  );
}