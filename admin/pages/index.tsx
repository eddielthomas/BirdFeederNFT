import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Image from 'next/image';
import Link from 'next/link';

const Home: NextPage = () => {
  return (
    <div className={`${styles.container} background`}>
      <Head>
        <title>Start off HyperNFT</title>
        <meta
          name="description"
          content='A template for implementing the HyperNFT Protocol wtih Rainbowkit in Next JS'
        />
        <link rel="icon" href="/images/favi.png" />
      </Head>

      <main className={styles.main}>
        <div className="flex items-center gap-4">
        <ConnectButton />
          <Link href='https://github.com/eddielthomas/hypernft' target='_blank'>
            <Image src='/images/github-mark-white.svg' height={22} width={22} alt='link to repository' />
          </Link>
        </div>

        <h1 className={`${styles.title} font-medium`}>
          Welcome to the HyperNFT Protocol
        </h1>

        <div className={`${styles.description} flex items-center gap-2`}>
          <p>Powered by</p>
          <a href="https://rainbowkit.com" className='text-lg'> + 🌈</a>
          <a href='href="https://nextjs.org/docs"'> + Next.js</a>
        </div>

        <div className={`${styles.grid} cursor-pointer`}>
          <Link href='/mint'>
          <div className={styles.card}>
            <h2 className='font-medium'>Mint 1 HyperNFT &rarr;</h2>
            <p>Mint one NFT Instantly</p>
          </div>
          </Link>

          <Link href='/batch-mint'>
          <div className={styles.card}>
            <h2 className='font-medium'>Batch Mint HyperNFT &rarr;</h2>
            <p>Batch Mint many NFTs</p>
          </div>
          </Link>

          <Link href='/lazy-mint'>
          <div className={styles.card}>
            <h2 className='font-medium'>Lazy Mint 1 HyperNFT &rarr;</h2>
            <p>Lazy Mint one NFT</p>
          </div>
          </Link>

           <Link href='/lazy-batch-mint'>
          <div className={styles.card}>
            <h2 className='font-medium'>Lazy Batch Mint HyperNFT &rarr;</h2>
            <p>Lazy Batch Mint many NFTs</p>
          </div>
          </Link>

           <Link href='/execute-lazy-mint'>
          <div className={styles.card}>
            <h2 className='font-medium'>Execute Lazy Mint HyperNFT &rarr;</h2>
            <p>Execute a lazy minted token</p>
          </div>
          </Link>

           <Link href='/admin-dashboard'>
          <div className={styles.card}>
            <h2 className='font-medium'>Admin Dashboard &rarr;</h2>
            <p>Deploying sophisticated NFT contracts has never been easier.</p>
          </div>
          </Link>
        </div>
      </main>

      <footer className='py-8 border-t border-white text-white'>
        <div>
        <p className='flex justify-center pb-4 text-xl'>For the developers helping artists of every industry 🥂</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
