import { DomainException } from './domain.exception';

export class InvalidBetAmountException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
