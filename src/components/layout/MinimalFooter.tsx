/** "Franco Núñez · Uruguay · {year}" — above the form; no ©, no "Todos los derechos reservados". */
export function MinimalFooter({ line }: { line: string }) {
  return (
    <footer className="micro muted minimal-footer">
      <p>{line}</p>
    </footer>
  );
}
