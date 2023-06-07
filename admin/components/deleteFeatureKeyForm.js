import React from "react";
import { useForm } from "react-hook-form";

const DeleteFeatureKeyForm = ({ onSubmit }) => {
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
      <button type="submit" className="btn">
        Delete Feature Key
      </button>
    </form>
  );
};

export default DeleteFeatureKeyForm;
