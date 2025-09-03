import Header from "./Header";

export default function HeroSection() {
  return (
    <div id="hero">
      <Header />
      <div className="content">
        <p className="left-text">UNIVERSITY OF KARACHI</p>
        <div className="centeredText">
          <p>Your Campus Companion is Here</p>
          <p className="first-letter:text-4xl">
            AskUoK – Your Virtual University Assistant
          </p>
          <p className="stretched">
            Have questions about fees, admissions, departments, or university
            life? AskUoK is here 24/7 to help you get instant answers, stay
            informed, and make your university journey smoother.
          </p>
        </div>
      </div>
      <div className="smoke-container">
        <svg>
          <path d="M 150 0 Q 200 100 100 250 C 0 450 120 400 50 600" />
        </svg>
      </div>
      <div className="reserve-btn-container">
        <center>
          <p className="price">Powered by the UBIT Student</p>
        </center>
      </div>
    </div>
  );
}
