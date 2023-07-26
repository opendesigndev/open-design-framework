{
  description = "Devshell flake for ODF";

  inputs = {
    nixpkgs.url      = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url  = "github:numtide/flake-utils";
    corepack-overlay = {
      url = "github:CodeWitchBella/corepack-overlay/main";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, corepack-overlay, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import corepack-overlay ./package.json) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
      in
      with pkgs;
      {
        packages.default = pkgs.corepack;
        devShells.default = mkShell {
          buildInputs = [
            pkgs.corepack
            pkgs.nodejs
          ];
        };
      }
    );
}