# Minikube wait action

This action waits until all your pods a VM-free Kubernetes cluster using Minikube.

## Pre-requisites

Your Actions workflow has a kubernetes setup. You may use [minikube-setup-action](https://github.com/marketplace/actions/minikube-setup-action) for that.

## Inputs

### `max-retry-attempts`

**Optional** Maximum of times the check can be carried on. Default `10`.

### `retry-delay`

**Optional** Time to wait (in seconds) before attempting the check after a failure. Default `30`.

## Example usage

```yaml
name: "Minikube workflow"
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: Setup Minikube
      id: minikube
      uses: CodingNagger/minikube-setup-action@v1.0.2
    - name: Launch Minikube
      run: eval ${{ steps.minikube.outputs.launcher }}
    - name: Install Nginx pod
      run: kubectl apply -f https://k8s.io/examples/application/deployment.yaml
    - name: Wait for pods
      uses: CodingNagger/minikube-wait-action@v1.0.1
    - name: Check pods
      run: |
        kubectl get pods
```