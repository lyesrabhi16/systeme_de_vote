{
  description = "SVS: development shell (Python 3.15, bun, Docker Compose, a JRE for the API client generator)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      # nix develop
      #   cd SVS-SERVER && uv venv && . .venv/bin/activate && make install && make test
      #   cd SVS-CLIENT && bun install && bun run test
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [ python315 uv bun nodejs_22 jre docker-compose openssl ];
        # Python wheels with compiled code (greenlet, ...) need libstdc++, which NixOS does not put on the library path
        LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib ];
      };
    };
}
