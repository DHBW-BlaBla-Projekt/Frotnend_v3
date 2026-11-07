export function ImpressumPage() {
  return (
    <main className="app-shell page">
      <article className="impressum">
        <span className="eyebrow">Rechtliches</span>
        <h1>Impressum</h1>
        <section aria-labelledby="provider-details">
          <h2 id="provider-details">Angaben gemäß § 5 DDG</h2>
          <address>
            <p>Julius Krämer, Noah Leister, Phil Giunta, Amanda Paulisch</p>
            <p>DHBW Mosbach</p>
            <p>74821</p>
          </address>
        </section>
        <section aria-labelledby="contact-details">
          <h2 id="contact-details">Kontakt</h2>
          <p>E-Mail: phi.giunta.25@lehre.mosbach.dhbw.de</p>
        </section>
      </article>
    </main>
  )
}
