import Image from "next/image";
import styles from "./hero.module.css";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section id="home" className={styles.hero}>
      <div className={`${styles.inner} container`}>
        <div className={styles.copy}>
          <p className={styles.kicker}>Недвижимость на Коста-дель-Соль</p>
          <h1 className={styles.title}>Найдите свой идеальный дом сегодня</h1>
          <p className={styles.subtitle}>
            Подбор объектов, сопровождение сделки и аренда. Минимализм в сайте — максимум пользы в работе.
          </p>

          <div className={styles.actions}>
            <Button href="#services" variant="primary">
              Смотреть услуги
            </Button>
            <Button href="#contact" variant="ghost">
              Связаться
            </Button>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.imageWrap}>
            <Image
              src="/hero/house.jpg"
              alt="Modern villa on Costa del Sol"
              fill
              priority
              sizes="(max-width: 900px) 92vw, 980px"
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
