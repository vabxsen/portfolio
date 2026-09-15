import Image from 'next/image';

export function BudgiePreview({ image, imageAlt }: { image: string; imageAlt: string }) {
  return (
    <div className="budgie-preview">
      <div className="budgie-preview-copy" aria-hidden="true">
        <span>Budgie.</span>
        <h4>
          Less surprise.
          <br />
          More peace of mind.
        </h4>
        <p>
          YOUR SUBSCRIPTIONS.
          <br />A CLEARER PICTURE.
        </p>
      </div>
      <div className="budgie-mobile">
        <Image
          src={image}
          alt={imageAlt}
          width={1080}
          height={2273}
          sizes="(max-width: 375px) 136px, (max-width: 1000px) 154px, 180px"
        />
      </div>
    </div>
  );
}
