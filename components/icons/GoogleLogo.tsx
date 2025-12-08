type Props = {
    width?: number | string;
    height?: number | string;
};

export const GoogleLogo: React.FC<Props> = ({ width = 32, height = 32 }) => {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
            }}
        >
            <svg width="24px" height="24px" viewBox="0 0 32 32" data-name="Layer 1" id="Layer_1" xmlns="http:
        </div>
    );
};