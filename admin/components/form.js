import React, { useState } from "react";

function Form({ onSubmit, placeholder, buttonText }) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    let data = {};
    data.value = inputValue;
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="form_details">
      <input
        id={placeholder.toLowerCase().replace(" ", "")}
        name={placeholder.toLowerCase().replace(" ", "")}
        type="text"
        placeholder={placeholder}
        required
        className="input"
        style={{ width: "100%", margin: 10 }}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button type="submit" className="btn">
        {buttonText}
      </button>
    </form>
  );
}

export default Form;
