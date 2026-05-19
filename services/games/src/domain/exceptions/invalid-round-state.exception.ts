import { DomainException } from './domain.exception';

export class InvalidRoundStateException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
