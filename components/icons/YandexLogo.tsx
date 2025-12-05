type Props = {
  width?: number | string;
  height?: number | string;
  fontSize?: number | string;
};

export const YandexLogo: React.FC<Props> = ({
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(4,4)">
            <rect x="0" y="0" width="24" height="24" rx="12" fill="#FC3F1D" />
            <path
              d="M9.6912 11.212H12.1982V-3.188H8.5516C4.8843 -3.188 2.9574 -1.3025 2.9574 1.4739C2.9574 3.6909 4.0141 4.9962 5.8995 6.3429L2.6259 11.212H5.3401L8.9867 5.7628L7.7228 4.9133C6.1896 3.8773 5.4437 3.0693 5.4437 1.3288C5.4437 -0.2044 6.5211 -1.2404 8.5723 -1.2404H9.6912V11.212Z"
              fill="white"
              transform="translate(4 8)"
            />
          </g>
        </svg>
      </svg>
    </div>
  );
};
