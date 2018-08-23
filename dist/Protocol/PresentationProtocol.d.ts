import { BaseMessage } from './Messages';
export declare namespace PresentationProtocol {
    class GetPresentations extends BaseMessage {
        templateOnly?: boolean;
        personalOnly?: boolean;
    }
}
