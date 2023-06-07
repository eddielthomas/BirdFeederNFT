import React, { useState } from "react";

import { useForm } from "react-hook-form";

const AddFeatureKeyForm = ({ onSubmit }) => {
  const { register, handleSubmit } = useForm();
  const [tokenId, setTokenId] = useState(0);
  const [featureName, setFeatureName] = useState("");
  const [userApiKey, setUserApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);

  const submitHandler = () => {
    event.preventDefault();
    let data = {};
    data.tokenId = parseInt(tokenId);
    data.featureName = featureName;
    data.userApiKey = userApiKey;
    data.secretKey = secretKey;
    data.expiresAt = parseInt(expiresAt);
    onSubmit(data);
  };

  return (
    <form onSubmit={submitHandler} className="form_details">
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("tokenId")}
        placeholder="Token ID"
        onChange={(e) => setTokenId(e.target.value)}
      />
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("featureName")}
        placeholder="Feature Name"
        onChange={(e) => setFeatureName(e.target.value)}
      />
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("userApiKey")}
        placeholder="User API Key"
        onChange={(e) => setUserApiKey(e.target.value)}
      />
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("secretKey")}
        placeholder="Secret Key"
        onChange={(e) => setSecretKey(e.target.value)}
      />
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("expiresAt")}
        placeholder="Expires At"
        onChange={(e) => setExpiresAt(e.target.value)}
      />
      <button type="submit" className="btn" onClick={submitHandler}>
        Add Feature Key
      </button>
    </form>
  );
};

export default AddFeatureKeyForm;
