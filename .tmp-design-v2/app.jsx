function App() {
  useCursor();
  useFadeIn();

  return (
    <React.Fragment>
      <div className="cursor-ring"></div>
      <div className="cursor-dot"></div>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <ModesSection />
        <StackSection />
        <FlowSection />
        <SdkSection />
        <CtaSection />
      </main>
      <Footer />
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
