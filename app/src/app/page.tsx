import { Header } from "@/components/Header/Header";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ padding: "84px 0" }}>
      <div className="container">
        <p style={{ color: "var(--accent)", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>
          Grahalia Estates
        </p>
        <h2 style={{ fontFamily: "var(--font-serif)", margin: "10px 0 12px" }}>{title}</h2>
        <div style={{ color: "var(--text-muted)", maxWidth: 820 }}>{children}</div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        <Section id="home" title="Найдите свой идеальный дом на Коста-дель-Соль">
          Здесь будет hero-блок: крупный заголовок, подзаголовок и кнопка “Посмотреть объекты”.
        </Section>

        <Section id="about" title="Ваш надёжный партнёр в недвижимости">
          Коротко про компанию, географию (Costa del Sol), стиль работы и сопровождение сделки.
        </Section>

        <Section id="services" title="Услуги">
          Консультации · Продажа · Аренда — в виде карточек (клик → отдельная страница).
        </Section>

        <Section id="gallery" title="Галерея">
          Тут будет сетка фото + модалка с затемнением (как в шаблоне).
        </Section>

        <Section id="contact" title="Свяжитесь с нами">
          Контактная форма + контакты + рабочие часы.
        </Section>
      </main>
    </>
  );
}
