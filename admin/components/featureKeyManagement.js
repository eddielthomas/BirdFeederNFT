import React, { useState } from "react";

function ExecuteLazyMintForm({ onSubmit }) {
  const [toField, setToField] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      lazyMintId: event.target.elements.lazyMintId.value,
      to: toField,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form_details">
      <input
        id="lazyMintId"
        name="lazyMintId"
        type="number"
        placeholder="Lazy Mint ID"
        required
        className="input"
        style={{ width: "100%", margin: 10 }}
      />

      <label>Enter Address:</label>

      <div
        className="form-details"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <input
          id={`to`}
          name={`to`}
          type="text"
          placeholder="Address"
          required
          className="input"
          style={{ width: "100%", margin: 10 }}
          onChange={(e) => setToField(e.target.value)}
        />
      </div>

      <button type="submit" className="btn" onClick={handleSubmit}>
        Execute Lazy Mint
      </button>
    </form>
  );
}

export default ExecuteLazyMintForm;
