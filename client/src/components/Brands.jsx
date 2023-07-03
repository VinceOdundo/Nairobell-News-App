import React from "react";
import {
  punch,
  lexpressmu,
  mailguardian,
  thestandard,
  nation,
} from "../assets/imports";

const Brand = () => (
  <div className="flex flex-wrap justify-center items-center p-4">
    <div className="flex justify-center items-center m-4 w-32">
      <img src={punch} alt="punch" />
    </div>
    <div className="flex justify-center items-center m-4 w-32">
      <img src={lexpressmu} alt="lexpressmu" />
    </div>
    <div className="flex justify-center items-center m-4 w-32">
      <img src={mailguardian} alt="mailguardian" />
    </div>
    <div className="flex justify-center items-center m-4 w-32">
      <img src={thestandard} alt="thestandard" />
    </div>
    <div className="flex justify-center items-center m-4 w-32">
      <img src={nation} alt="nation" />
    </div>
  </div>
);

export default Brand;
