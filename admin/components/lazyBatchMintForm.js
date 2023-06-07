import React, { useState } from "react";

function LazyBatchMintForm({ onSubmit }) {
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
      setDataFields(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    let data = {};
    data.data = dataFields;
    data._referralCodes = [];

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="form_details">
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

      {/* <label>Or add one by one:</label> */}

      {/* <div
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
      </div> */}

      <button type="submit" className="btn" onClick={handleSubmit}>
        Lazy Batch Mint
      </button>
    </form>
  );
}

export default LazyBatchMintForm;
