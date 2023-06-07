import React, { useState } from "react";

function BatchMintForm({ onSubmit }) {
  const [dataFields, setDataFields] = useState([""]);
  const [referralCodeFields, setReferralCodeFields] = useState([""]);

  const handleAddDataField = () => {
    setDataFields([...dataFields, ""]);
  };

  const handleAddReferralCodeField = () => {
    setReferralCodeFields([...referralCodeFields, ""]);
  };

  const parseDataFields = (data) => {
    try {
      const dataFields = JSON.parse(data);
      setDataFields(dataFields);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      payableAmount: event.target.elements.payableAmount.value,
      data: dataFields,
      _referralCodes: referralCodeFields,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form_details">
      <input
        id="payableAmount"
        name="payableAmount"
        type="number"
        step="0.01"
        placeholder="Payable Amount"
        required
        className="input"
        style={{ width: "100%", margin: 10 }}
      />

      {/* add a text area for an user to paste in many data fields that are comma separated then when the user submits it is parsed in to the dataFields */}

      <div>
        <label htmlFor="data">Paste all:</label>
        <textarea
          id="data"
          name="data"
          type="text"
          placeholder="Data"
          className="input"
          style={{ width: "100%", margin: 10 }}
          onChange={(e) => parseDataFields(e.target.value)}
        />
      </div>

      <label>Or add one by one:</label>

      <div
        className="form-details"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          className="btn"
          style={{ width: "145px", height: "35px", fontSize: "12px" }}
          onClick={handleAddDataField}
        >
          Add More Data
        </button>
        {dataFields.map((_, index) => (
          <div key={index}>
            <input
              id={`data${index}`}
              name={`data${index}`}
              type="text"
              placeholder="Data"
              required
              className="input"
              style={{ width: "100%", margin: 10 }}
            />
          </div>
        ))}
      </div>

      <button type="submit" className="btn">
        Batch Mint
      </button>
    </form>
  );
}

export default BatchMintForm;
