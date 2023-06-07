import React, { useState } from "react";

function ExecuteLotteryMint({ onSubmit, lazyMintId, image }) {
  const [toField, setToField] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (lazyMintId === "") {
      alert("Please enter a Lazy Mint ID");
      return;
    }
    onSubmit({
      lazyMintId: lazyMintId,
      to: toField,
    });
  };

  //

  return (
    <form onSubmit={handleSubmit} className="form_details">
      {/* Display the image below */}

      <div
        className="form-details"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img
          src={image}
          alt="NFT"
          style={{
            height: "350vw",
            margin: 10,
            leftMargin: "200px",
            rightMargin: "200px",
          }}
        />
        {/* make the image centered and */}
        <label>Enter Address:</label>
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
        Execute Lottery Mint
      </button>
    </form>
  );
}

export default ExecuteLotteryMint;
