import React, { useState } from "react";
import SectionSelection from "./components/SectionSelection";
import AttendancePage from "./pages/AttendancePage";

function App() {
  const [activeSection, setActiveSection] = useState(null);

  if (activeSection) {
    return (
      <AttendancePage
        sectionId={activeSection}
        onBack={() => setActiveSection(null)}
      />
    );
  }

  return <SectionSelection onSelectSection={setActiveSection} />;
}

export default App;
