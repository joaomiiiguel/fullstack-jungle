import { DomainException } from './domain.exception';

export class InsufficientFundsException extends DomainException {
  constructor(message = 'Saldo insuficiente na carteira') {
    super(message);
  }
}
