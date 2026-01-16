import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'PocketBase-Powered Profiles',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Seamlessly authenticate against PocketBase and spin up verification
        records with a single request. Every profile returns a redirect link to
        the branded onboarding flow.
      </>
    ),
  },
  {
    title: 'Idempotent Partner Flows',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        POST to <code>/api/profiles/create</code> and reuse existing records when
        a document is already on file. No duplicate KYC journeys, no wasted
        manual reviews.
      </>
    ),
  },
  {
    title: 'Real-Time Status Sync',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Keep downstream systems current with <code>GET /api/profiles/:id</code>.
        The response merges the latest status history update with the underlying
        profile so analysts and partners stay aligned.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((feature) => (
            <Feature key={feature.title} {...feature} />
          ))}
        </div>
        <div className="row">
          <div className="col col--12 text--center margin-top--lg">
            <Link className="button button--primary" to="/docs/get-started">
              Explore the Docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
