import React, { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import DiscoveryPage from "./pages/DiscoveryPage";
import CandidatesPage from "./pages/CandidatesPage";
import DrugProfilePage from "./pages/DrugProfilePage";
import StrategyPage from "./pages/StrategyPage";
import ReferencesPage from "./pages/ReferencesPage";
import "./App.css";

const BASE = process.env.REACT_APP_API_URL || "";

function App() {
  const [currentPage, setCurrentPage] = useState("discovery");
  const [selectedRoa, setSelectedRoa] = useState("");
  const [selectedForm, setSelectedForm] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [references, setReferences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = (page) => setCurrentPage(page);

  const stepProps = { currentPage, navigate, selectedDrug, strategy };

  const handleFilter = async (roa, form) => {
    setIsLoading(true);
    setSelectedRoa(roa);
    setSelectedForm(form);
    try {
      const res = await fetch(
        `${BASE}/api/candidates?roa=${encodeURIComponent(roa)}&dosageForm=${encodeURIComponent(form)}`
      );
      const data = await res.json();
      setCandidates(data.candidates || []);
      setSelectedDrug(null);
      setStrategy(null);
      setReferences([]);
      navigate("candidates");
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleSelectDrug = async (candidateId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/drug/${candidateId}`);
      const data = await res.json();
      setSelectedDrug(data);
      setStrategy(null);
      setReferences([]);
      navigate("drug");
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleGetStrategy = async () => {
    if (!selectedDrug) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/strategy/${selectedDrug.candidate_id}`);
      const data = await res.json();
      setStrategy(data.strategy);
      setReferences(data.references || []);
      navigate("strategy");
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const pages = {
    discovery: (
      <DiscoveryPage onFilter={handleFilter} isLoading={isLoading} stepProps={stepProps} />
    ),
    candidates: (
      <CandidatesPage
        candidates={candidates}
        selectedRoa={selectedRoa}
        selectedForm={selectedForm}
        onSelectDrug={handleSelectDrug}
        onBack={() => navigate("discovery")}
        isLoading={isLoading}
        stepProps={stepProps}
      />
    ),
    drug: (
      <DrugProfilePage
        drug={selectedDrug}
        onGetStrategy={handleGetStrategy}
        onBack={() => navigate("candidates")}
        isLoading={isLoading}
        stepProps={stepProps}
      />
    ),
    strategy: (
      <StrategyPage
        strategy={strategy}
        drug={selectedDrug}
        onViewReferences={() => navigate("references")}
        onBack={() => navigate("drug")}
        stepProps={stepProps}
      />
    ),
    references: (
      <ReferencesPage
        references={references}
        drug={selectedDrug}
        onBack={() => navigate("strategy")}
        stepProps={stepProps}
      />
    ),
  };

  return (
    <div className="app-shell">
      <Header navigate={navigate} />
      <main className="main-content">
        {pages[currentPage]}
      </main>
      <Footer />
    </div>
  );
}

export default App;
