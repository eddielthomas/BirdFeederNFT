import React from "react";
import { useForm } from "react-hook-form";

const UpdateFeatureKeyForm = ({ onSubmit }) => {
  const { register, handleSubmit } = useForm();

  const submitHandler = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="form_details">
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("tokenId")}
        placeholder="Token ID"
      />
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("index")}
        placeholder="Index"
      />
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("featureName")}
        placeholder="Feature Name"
      />
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("userApiKey")}
        placeholder="User API Key"
      />
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("secretKey")}
        placeholder="Secret Key"
      />
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("expiresAt")}
        placeholder="Expires At"
      />
      <input
        className="input"
        style={{ width: "100%", margin: 10 }}
        {...register("active")}
        type="checkbox"
      />
      <button type="submit" className="btn">
        Update Feature Key
      </button>
    </form>
  );
};

export default UpdateFeatureKeyForm;
