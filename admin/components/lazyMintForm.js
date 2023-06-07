import React, { useState } from "react";

function LazyMintForm({ onSubmit }) {
  const [amount, setAmount] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [data, setData] = useState("");
  const [referrer, setReferrer] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    let _data = {};
    _data.data = data;
    _data.referrer = referrer;

    onSubmit(_data);
  };

  return (
    <form onSubmit={handleSubmit} className="form_details">
      <input
        id="data"
        name="data"
        type="text"
        placeholder="Data"
        required
        className="input"
        style={{ width: "100%", margin: 10 }}
        onChange={(e) => setData(e.target.value)}
      />

      <input
        id="referrer"
        name="referrer"
        type="text"
        placeholder="Referrer"
        required
        className="input"
        style={{ width: "100%", margin: 10 }}
        onChange={(e) => setReferrer(e.target.value)}
      />

      <button type="submit" className="btn" onClick={handleSubmit}>
        Lazy Mint
      </button>
    </form>
  );
}

export default LazyMintForm;
