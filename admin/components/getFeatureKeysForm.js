import { parse } from "path";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const GetFeatureKeysForm = ({ onSubmit, featureKeys }) => {
  const { register, handleSubmit } = useForm();
  const [inputValue, setInputValue] = useState(0);

  const submitHandler = (data) => {
    event.preventDefault();
    let _data = {};
    _data.value = inputValue;
    onSubmit(_data);
  };

  const parseDataFields = (data) => {
    try {
      data = parseInt(data);
      setInputValue(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <form onSubmit={submitHandler} className="form_details">
        <input
          id="tokenId"
          className="input"
          style={{ width: "100%", margin: 10 }}
          {...register("tokenId")}
          placeholder="Token ID"
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="btn" onClick={submitHandler}>
          Get Feature Keys
        </button>
      </form>
      {featureKeys && featureKeys.length > 0 && (
        <div>
          <h3>Feature Keys</h3>
          <ul>
            {featureKeys.map((featureKey, index) => (
              <li key={index}>
                <p>Feature Name: {featureKey.featureName}</p>
                <p>User API Key: {featureKey.userApiKey}</p>
                <p>Secret Key: {featureKey.secretKey}</p>
                <p>Expires At: {featureKey.expiresAt}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default GetFeatureKeysForm;
