import React, { useState } from "react";

function MintForm({ onSubmit }) {
  const [amount, setAmount] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [data, setData] = useState("");
  const [referrer, setReferrer] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      amount,
      recipient,
      data,
      referrer,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form_details">
      <input
        id="amount"
        name="amount"
        type="number"
        step="0.01"
        placeholder="Amount"
        required
        className="input"
        style={{ width: "100%", margin: 10 }}
        onChange={(e) => setAmount(e.target.value)}
      />

      <input
        id="recipient"
        name="recipient"
        type="text"
        placeholder="Recipient"
        required
        className="input"
        style={{ width: "100%", margin: 10 }}
        onChange={(e) => setRecipient(e.target.value)}
      />

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
        Mint
      </button>
    </form>
  );
}

export default MintForm;
