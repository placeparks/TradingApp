import React, { useState } from 'react';
import { Modal, Button, Tab, Tabs, Form } from 'react-bootstrap';
import { Web3Button } from "@thirdweb-dev/react";
import { contractAddress, contractAbi } from "./contract";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./styles/Home.css";
import LottieLoader from 'react-lottie-loader';
import trade from './assets/trade.json';
import Confetti from 'react-confetti';

export default function Home() {
  const [amountPILA, setAmountPILA] = useState(0);
  const [amountUSDT, setAmountUSDT] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('buy');
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const roundToDecimals = (number, decimals) => {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
  };

  const calculateReceivedUSDTForSelling = (value) => {
    const conversionRate = 2.00e-7;
    return roundToDecimals(value * conversionRate, 7);  // Assuming 7 decimal places for USDT
  };

  const convertToSmallestUnitForBuy = (value) => {
    return value * Math.pow(10, 6);
  };

  const convertToSmallestUnitForSell = (value) => {
    return value * Math.pow(10, 6);
  };

  const calculateRequiredUSDT = (value) => {
    return (value / 5);
  };

  const onBuySuccess = () => {
    setShowConfetti(true);
    // Hide confetti after 5 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
  };
  return (
    <main className="main">
      <div className="container">
      <h1>Welcome to the PILA Exchange Platform!</h1>
        <p>
          You can buy PILA tokens using USDT. Not only that,
          but you can also convert your PILA tokens back to USDT whenever you want.
        </p>
        
        <Button onClick={handleShow}>Buy/Sell</Button>
        <LottieLoader animationData={trade} style={{ height: '400px' }} />
        <Modal show={showModal} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>{activeTab === 'buy' ? 'Buy PILA' : 'Sell PILA'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Tab eventKey="buy" title="Buy">
                <Form.Group>
                  <Form.Label>Enter amount of PILA</Form.Label>
                  <Form.Control 
                    type="number"
                    value={amountPILA}
                    onChange={(e) => {
                      setAmountPILA(e.target.value);
                      setAmountUSDT(calculateRequiredUSDT(e.target.value));
                    }}
                    placeholder="Enter amount of PILA"
                  />
                  <Form.Text>Required USDT: {amountUSDT}</Form.Text>
                </Form.Group>
                {showConfetti && <Confetti />}

<Web3Button
  contractAddress={contractAddress}
  contractAbi={contractAbi}
  action={(contract) => {
    contract.call("BuyPilaWithUSDT", [convertToSmallestUnitForBuy(amountUSDT)])
      .then(onBuySuccess);
  }}
>
  Buy PILA
</Web3Button>
              </Tab>
              <Tab eventKey="sell" title="Sell">
                <Form.Group>
                  <Form.Label>Enter amount of PILA to sell</Form.Label>
                  <Form.Control 
                    type="number"
                    value={amountPILA}
                    onChange={(e) => setAmountPILA(e.target.value)}
                    placeholder="Enter amount of PILA to sell"
                  />
                  <Form.Text>You will receive approximately {calculateReceivedUSDTForSelling(amountPILA).toFixed(7)} USDT for selling {amountPILA} PILA</Form.Text>
                </Form.Group>
                <Web3Button
          contractAddress={contractAddress}
          contractAbi={contractAbi}
          action={(contract) => contract.call("SellPilaForUSDT", [amountPILA])}
        >
          Sell PILA
        </Web3Button>
              </Tab>
            </Tabs>
          </Modal.Body>
        </Modal>
      </div>
    </main>
  );
}
